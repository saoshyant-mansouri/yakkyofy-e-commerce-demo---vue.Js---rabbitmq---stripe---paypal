# RabbitMQ, via CloudAMQP's free forever "lemming" plan — not Azure, on
# purpose (per your choice): the only Azure-native option would be a
# self-hosted always-on Container App, which can't scale to zero and costs
# ~$4-6/mo even mostly idle. This is genuinely $0.
#
# Note: the free "lemming" plan runs LavinMQ, CloudAMQP's own broker — it
# speaks the same AMQP 0-9-1 wire protocol as RabbitMQ, so amqplib (what
# apps/api and apps/worker use) works against it unmodified. Paid CloudAMQP
# plans run real RabbitMQ if that distinction ever matters.
resource "cloudamqp_instance" "main" {
  name   = var.project
  plan   = "lemming"
  region = var.cloudamqp_region
  tags   = ["yakkyofy-demo"]
}
