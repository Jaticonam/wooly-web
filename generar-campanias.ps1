$root = (Get-Location).Path
$campaignDir = Join-Path $root "ui\public\campanias"
$ogDir = Join-Path $root "ui\public\og\campanias"

New-Item -ItemType Directory -Force -Path $campaignDir | Out-Null
New-Item -ItemType Directory -Force -Path $ogDir | Out-Null

$campaigns = @(
  @{ slug="san-valentin"; name="San Valentín"; title="Insumos para San Valentín | Wooly Import Store"; desc="Flores, peluches, globos, cajas y accesorios por mayor para vender más en San Valentín." },
  @{ slug="dia-mujer"; name="Día de la Mujer"; title="Insumos para el Día de la Mujer | Wooly Import Store"; desc="Productos mayoristas para detalles, regalos y campañas del Día de la Mujer." },
  @{ slug="dia-madre"; name="Día de la Madre"; title="Insumos para el Día de la Madre | Wooly Import Store"; desc="Flores, empaques, peluches y accesorios por mayor para la campaña de mamá." },
  @{ slug="dia-padre"; name="Día del Padre"; title="Insumos para el Día del Padre | Wooly Import Store"; desc="Detalles, cajas, accesorios y productos mayoristas para vender más en campaña de papá." },
  @{ slug="vuelta-clases"; name="De Vuelta a Clases"; title="Insumos para De Vuelta a Clases | Wooly Import Store"; desc="Productos de alta rotación para emprendedores en la temporada de vuelta a clases." },
  @{ slug="graduados"; name="Graduados"; title="Detalles e Insumos para Graduados | Wooly Import Store"; desc="Globos, flores, peluches, cajas y accesorios por mayor para sorprender a los graduados." },
  @{ slug="flores-amarillas"; name="Flores Amarillas"; title="Insumos para Flores Amarillas | Wooly Import Store"; desc="Flores, papeles, cintas y accesorios por mayor para la campaña de Flores Amarillas." },
  @{ slug="hotwheels"; name="Hot Wheels"; title="Hot Wheels por Mayor | Wooly Import Store"; desc="Autos Hot Wheels por unidad, pack, docena, medio ciento y caja para emprendedores y coleccionistas." }
)

foreach ($c in $campaigns) {
  $url = "https://www.woolyimports.com/campanias/$($c.slug).html"
  $target = "https://www.woolyimports.com/catalogo?cpg=$($c.slug)"
  $image = "https://www.woolyimports.com/og/campanias/$($c.slug).jpg"
  $file = Join-Path $campaignDir "$($c.slug).html"

$html = @"
<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#ffffff">

<title>$($c.title)</title>
<meta name="description" content="$($c.desc)">
<meta name="robots" content="index,follow">
<link rel="canonical" href="$url">

<meta property="og:type" content="website">
<meta property="og:locale" content="es_PE">
<meta property="og:site_name" content="Wooly Import Store">
<meta property="og:title" content="$($c.title)">
<meta property="og:description" content="$($c.desc)">
<meta property="og:url" content="$url">
<meta property="og:image" content="$image">
<meta property="og:image:secure_url" content="$image">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="$($c.name) - Wooly Import Store">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$($c.title)">
<meta name="twitter:description" content="$($c.desc)">
<meta name="twitter:image" content="$image">

<meta http-equiv="refresh" content="2;url=$target">
<script>
setTimeout(() => {
  window.location.replace("$target");
}, 2000);
</script>
</head>
<body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#fff;color:#555;margin:0;">
  <div style="text-align:center;padding:24px;">
    <h2>🚀 Redireccionando...</h2>
    <p>Te llevamos al catálogo de $($c.name) en Wooly Import Store.</p>
    <p><a href="$target">Ir al catálogo</a></p>
  </div>
</body>
</html>
"@

  [System.IO.File]::WriteAllText(
    $file,
    $html,
    [System.Text.UTF8Encoding]::new($false)
  )
}

Write-Host "✅ 8 HTMLs de campañas regenerados correctamente en UTF-8."
