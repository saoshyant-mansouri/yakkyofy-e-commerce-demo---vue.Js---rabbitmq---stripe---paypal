# Azure for Students subscriptions cap Container App Environments at 1 per
# subscription — confirmed the hard way (MaxNumberOfGlobalEnvironmentsInSubExceeded
# on a second attempt, in a different region, after an earlier attempt failed
# on a *per-region* cap in France Central specifically). There is no path to
# a second, fully separate environment on this subscription regardless of
# region — so this reuses the existing one instead of creating a new one.
#
# This is a *reference*, not a managed resource: yakkyofy's Terraform state
# never owns this environment and `terraform destroy` here can't touch it or
# anything else running in it. The api/worker Container Apps that use it are
# still fully independent resources — their own scaling, ingress, secrets —
# just co-located in the same environment as another project.
data "azurerm_container_app_environment" "main" {
  name                = var.existing_container_app_environment_name
  resource_group_name = var.existing_container_app_environment_resource_group
}
