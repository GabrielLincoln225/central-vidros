# Ensure directories exist
$dirs = @(
    "public/hero",
    "public/insulfilm",
    "public/servicos",
    "public/cuidados",
    "public/marcas",
    "public/loja",
    "public/brand",
    "public/og"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
    }
}

Write-Host "1. Generating hero.mp4 (all keyframes, no audio, 1920x1080)..."
ffmpeg -y -i Car_window_tinting_and_headlights_20260928194411.mp4 `
    -c:v libx264 -g 1 -keyint_min 1 -bf 0 -crf 20 -pix_fmt yuv420p -an -movflags +faststart `
    public/hero/hero.mp4

Write-Host "2. Generating hero-mobile.mp4 (all keyframes, no audio, 1280x720)..."
ffmpeg -y -i Car_window_tinting_and_headlights_20260928194411.mp4 `
    -vf "scale=1280:720" -c:v libx264 -g 1 -keyint_min 1 -bf 0 -crf 22 -pix_fmt yuv420p -an -movflags +faststart `
    public/hero/hero-mobile.mp4

Write-Host "3. Generating poster and final frames..."
# First frame (0s)
ffmpeg -y -ss 00:00:00 -i Car_window_tinting_and_headlights_20260928194411.mp4 -vframes 1 -q:v 2 public/hero/hero-poster.jpg
ffmpeg -y -ss 00:00:00 -i Car_window_tinting_and_headlights_20260928194411.mp4 -vframes 1 -c:v libwebp -quality 90 public/hero/hero-poster.webp

# Last frame (t=7.9)
ffmpeg -y -ss 00:00:07.9 -i Car_window_tinting_and_headlights_20260928194411.mp4 -vframes 1 -q:v 2 public/hero/hero-final.jpg
ffmpeg -y -ss 00:00:07.9 -i Car_window_tinting_and_headlights_20260928194411.mp4 -vframes 1 -c:v libwebp -quality 90 public/hero/hero-final.webp

# Loja fachada fallback
Copy-Item public/hero/hero-final.webp public/loja/fachada.webp -Force
Copy-Item public/hero/hero-final.jpg public/loja/fachada.jpg -Force

Write-Host "4. Generating insulfilm antes e depois (1040x650)..."
# Crop and scale to 1040x650 centered
ffmpeg -y -i Black_SUV_in_studio_2K_20260928193835.jpg -vf "scale=1040:650:force_original_aspect_ratio=increase,crop=1040:650" -q:v 2 public/insulfilm/antes.jpg
ffmpeg -y -i Black_SUV_in_studio_2K_20260928193835.jpg -vf "scale=1040:650:force_original_aspect_ratio=increase,crop=1040:650" -c:v libwebp -quality 90 public/insulfilm/antes.webp

ffmpeg -y -i Black_SUV_in_studio_2K_20260928193932.jpg -vf "scale=1040:650:force_original_aspect_ratio=increase,crop=1040:650" -q:v 2 public/insulfilm/depois.jpg
ffmpeg -y -i Black_SUV_in_studio_2K_20260928193932.jpg -vf "scale=1040:650:force_original_aspect_ratio=increase,crop=1040:650" -c:v libwebp -quality 90 public/insulfilm/depois.webp

Write-Host "5. Generating cuidados images..."
# Cuidados 1 (Ar seco / ar-condicionado - interior focus / car detail)
ffmpeg -y -i Black_SUV_in_studio_2K_20260928193835.jpg -vf "scale=800:1000:force_original_aspect_ratio=increase,crop=800:1000,colorchannelmixer=rr=0.7:gg=0.7:bb=0.7" -c:v libwebp -quality 85 public/cuidados/1.webp
# Cuidados 2 (Vedações poeira - window / door seal detail)
ffmpeg -y -i Black_SUV_in_studio_2K_20260928193932.jpg -vf "scale=800:1000:force_original_aspect_ratio=increase,crop=800:1000:0:0,colorchannelmixer=rr=0.6:gg=0.6:bb=0.6" -c:v libwebp -quality 85 public/cuidados/2.webp
# Cuidados 3 (Farol amarelado / iluminação - headlight focus)
ffmpeg -y -i Black_SUV_in_studio_2K_20260928193932.jpg -vf "scale=800:1000:force_original_aspect_ratio=increase,crop=800:1000:400:200,colorchannelmixer=rr=0.8:gg=0.7:bb=0.7" -c:v libwebp -quality 85 public/cuidados/3.webp

Write-Host "Media processing completed!"
