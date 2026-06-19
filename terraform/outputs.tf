output "ecr_repository_url" {
  value = aws_ecr_repository.decision_dna.repository_url
}

output "alb_hostname" {
  value = aws_lb.main.dns_name
}
