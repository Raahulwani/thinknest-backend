# Azure automatic deployment with Terraform & GitHub Actions

This bundle contains:
- `Dockerfile` — containerizes your TypeScript Node backend
- `terraform/` — Terraform infra to create ACR, Web App, PostgreSQL
- `.github/workflows/azure-deploy.yml` — builds Docker image, pushes to ACR, then runs Terraform to apply

## Quick steps (high level)

1. Create a GitHub repository and push your project (including this Dockerfile and `terraform/` dir).
2. Create an Azure Service Principal and grant it sufficient rights:
   ```bash
   az login
   az account set -s <subscription-id>
   az ad sp create-for-rbac --name "github-actions-terraform" --role Contributor --scopes /subscriptions/<subscription-id> --sdk-auth
   ```
   Save the JSON output — you'll add it to GitHub secrets.
3. In your GitHub repo settings > Secrets, add:
   - `AZURE_CREDENTIALS` : the JSON output from the command above
   - `TF_VAR_postgres_password` : a strong DB password for PostgreSQL
   - `IMAGE_TAG` : optional (defaults to `latest`)
4. Commit and push. The `azure-deploy` workflow will:
   - log into Azure
   - build and push Docker image to the created ACR
   - run `terraform init` and `terraform apply -auto-approve` to provision infra and configure the Web App to use the just-pushed image.

## Notes & next steps

- For production, **do not** store sensitive DB passwords in GitHub secrets forever. Use Azure Key Vault and Managed Identity.
- The current setup uses ACR admin enabled and app settings to configure the container registry credentials. You may switch to a managed identity approach.
- Customize CPU/RAM/sku sizes in `terraform/variables.tf` and `terraform/main.tf`.
- The app expects a Postgres connection string — set it in the Web App settings (you can add it to Terraform `azurerm_web_app` `app_settings`).


## Important workflow detail

Because ACR must exist before you can push an image into it, the simplest approach is:
1. Run Terraform manually once (or run the workflow twice):
   - First run: Terraform will create the ACR and other resources.
   - Second run: the build/push step can push the image into the already-created ACR.
2. Or split the workflow into two jobs where the Terraform job runs first to create infra, and the build job runs after with `needs: terraform-job`. The sample workflow above is a compact starting point.

If you'd like, I can modify the workflow to run Terraform first and then build+push automatically (recommended).
