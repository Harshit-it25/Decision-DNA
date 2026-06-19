param (
    [string]$ProjectId = $(gcloud config get-value project)
)

$ServiceName = "decision-dna-api"
$Region = "us-central1"

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    Write-Error "Project ID not found. Please set your project using 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
}

Write-Host "Using Project ID: $ProjectId"
Write-Host "Deploying $ServiceName to $Region..."

# 1. Build and Submit to Artifact Registry
Write-Host "`n=== Building and Pushing Container Image ==="
gcloud builds submit --tag "gcr.io/$ProjectId/$ServiceName"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build container."
    exit $LASTEXITCODE
}

# 2. Deploy to Cloud Run
Write-Host "`n=== Deploying to Cloud Run ==="
gcloud run deploy $ServiceName `
    --image "gcr.io/$ProjectId/$ServiceName" `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --memory 1Gi `
    --cpu 1 `
    --min-instances 1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed."
    exit $LASTEXITCODE
}

Write-Host "`n=== Deployment Complete! ==="
$url = gcloud run services describe $ServiceName --platform managed --region $Region --format 'value(status.url)'
Write-Host "`nYour Cloud Run Application is live at: $url"
