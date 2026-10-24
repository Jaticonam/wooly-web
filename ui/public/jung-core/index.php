<?php
// Same-origin human-session bridge. The upstream is never request-controlled.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function bridgeError(int $status, string $message): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}
/*
 * P4-SEC-03 — Origin. AdminOriginGuard (JUNG CORE) compares the browser's
 * Origin exactly against JUNG_CORE_ADMIN_ORIGINS and fails closed when it is
 * missing or "null". The bridge therefore relays the original value verbatim
 * or not at all: it never fabricates, rewrites or derives it from Host /
 * X-Forwarded-Host. A present but malformed Origin is rejected here (400).
 */
function bridgeIsValidOrigin(string $value): bool {
    if ($value === 'null') return true; // Opaque origin: relayed so CORE rejects it.
    if (strlen($value) > 2048 || preg_match('/[\x00-\x20\x7f]/', $value)) return false;
    $label = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?';
    if (!preg_match('~^https?://(?:' . $label . '(?:\.' . $label . ')*|\[[0-9A-Fa-f:.]+\])(?::([0-9]{1,5}))?$~i', $value, $match)) return false;
    return !isset($match[1]) || ((int) $match[1] >= 1 && (int) $match[1] <= 65535);
}
/*
 * P4-SEC-03 — Retry-After. Only the delta-seconds form JUNG CORE emits
 * (integer >= 1) is relayed, only for 429/503, only when CORE sent exactly
 * one value, and re-serialised from the parsed integer (no raw passthrough).
 */
function bridgeRetryAfter(array $values, int $status): ?string {
    if (!in_array($status, [429, 503], true) || count($values) !== 1) return null;
    $value = trim((string) $values[0]);
    if (!preg_match('/^[0-9]{1,6}$/', $value)) return null;
    $seconds = (int) $value;
    return ($seconds >= 1 && $seconds <= 86400) ? (string) $seconds : null;
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'], true)) {
    header('Allow: GET, HEAD, OPTIONS, POST, PUT');
    bridgeError(405, 'Method not allowed.');
}
$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH);
if (!is_string($path) || !preg_match('~^/jung-core(?:/|$)~', $path) || preg_match('/[\x00-\x20\x7f\\\\#]/', $uri)) {
    bridgeError(400, 'Invalid bridge path.');
}
$origin = null;
if (array_key_exists('HTTP_ORIGIN', $_SERVER)) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    if (!is_string($origin) || !bridgeIsValidOrigin($origin)) bridgeError(400, 'Invalid Origin header.');
}
$upstreamPath = substr($path, strlen('/jung-core'));
$query = $_SERVER['QUERY_STRING'] ?? '';
$url = 'https://core.jungnegocios.com' . ($upstreamPath === '' ? '/' : $upstreamPath) . ($query === '' ? '' : '?' . $query);
if (!function_exists('curl_init')) bridgeError(502, 'JUNG CORE bridge unavailable.');
$curl = curl_init($url);
if ($curl === false) bridgeError(502, 'JUNG CORE bridge unavailable.');
$headers = [];
foreach (['HTTP_ACCEPT' => 'Accept', 'CONTENT_TYPE' => 'Content-Type', 'HTTP_COOKIE' => 'Cookie'] as $key => $name) {
    if (isset($_SERVER[$key]) && !preg_match('/[\r\n]/', $_SERVER[$key])) $headers[] = $name . ': ' . $_SERVER[$key];
}
if ($origin !== null) $headers[] = 'Origin: ' . $origin;
$responseHeaders = [];
$retryAfterValues = [];
curl_setopt_array($curl, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HEADERFUNCTION => static function ($handle, string $line) use (&$responseHeaders, &$retryAfterValues): int {
        if (preg_match('~^HTTP/~i', $line)) {
            $responseHeaders = [];
            $retryAfterValues = [];
        }
        $separator = strpos($line, ':');
        if ($separator !== false) {
            $name = strtolower(trim(substr($line, 0, $separator)));
            if (in_array($name, ['content-type', 'set-cookie'], true)) $responseHeaders[] = trim($line);
            if ($name === 'retry-after') $retryAfterValues[] = substr($line, $separator + 1);
        }
        return strlen($line);
    },
]);
if ($method === 'HEAD') curl_setopt($curl, CURLOPT_NOBODY, true);
if (in_array($method, ['POST', 'PUT', 'OPTIONS'], true)) curl_setopt($curl, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
$body = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);
if ($body === false || $status < 100) bridgeError(502, 'Could not reach JUNG CORE.');
http_response_code($status);
foreach ($responseHeaders as $header) header($header, stripos($header, 'Set-Cookie:') !== 0);
$retryAfter = bridgeRetryAfter($retryAfterValues, $status);
if ($retryAfter !== null) header('Retry-After: ' . $retryAfter);
header('Cache-Control: no-store');
if ($method !== 'HEAD') echo $body;
