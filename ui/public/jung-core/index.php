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
$responseHeaders = [];
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
    CURLOPT_HEADERFUNCTION => static function ($handle, string $line) use (&$responseHeaders): int {
        if (preg_match('~^HTTP/~i', $line)) $responseHeaders = [];
        $separator = strpos($line, ':');
        if ($separator !== false) {
            $name = strtolower(trim(substr($line, 0, $separator)));
            if (in_array($name, ['content-type', 'set-cookie'], true)) $responseHeaders[] = trim($line);
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
header('Cache-Control: no-store');
if ($method !== 'HEAD') echo $body;
