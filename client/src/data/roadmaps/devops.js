export const devopsRoadmap = {
  id: 'devops',
  title: 'DevOps Engineering',
  description: 'Master CI/CD, infrastructure, cloud, and automation',
  icon: '🛠️',
  color: '#f97316',
  gradient: 'from-orange-500 to-red-600',
  totalTopics: 0,
  sections: [
    {
      id: 'programming',
      title: 'Programming & Scripting',
      color: '#6366f1',
      topics: [
        { id: 'bash', label: 'Bash / Shell Scripting', type: 'required' },
        { id: 'python-scripts', label: 'Python for automation', type: 'recommended' },
        { id: 'yaml', label: 'YAML / JSON / TOML', type: 'required' },
      ]
    },
    {
      id: 'os',
      title: 'Operating Systems',
      color: '#64748b',
      topics: [
        { id: 'linux', label: 'Linux Administration', type: 'required' },
        { id: 'networking', label: 'Networking (TCP/IP, DNS, HTTP)', type: 'required' },
        { id: 'ssh', label: 'SSH & Remote Access', type: 'required' },
        { id: 'file-systems', label: 'File Systems & Permissions', type: 'required' },
      ]
    },
    {
      id: 'vcs',
      title: 'Version Control',
      color: '#f05032',
      topics: [
        { id: 'git', label: 'Git Fundamentals', type: 'required' },
        { id: 'git-flow', label: 'Git Flow / Trunk-Based Development', type: 'recommended' },
      ]
    },
    {
      id: 'containers',
      title: 'Containers',
      color: '#2496ed',
      topics: [
        { id: 'docker', label: 'Docker & Docker Compose', type: 'required' },
        { id: 'kubernetes', label: 'Kubernetes (K8s)', type: 'required' },
        { id: 'helm', label: 'Helm Charts', type: 'recommended' },
        { id: 'container-security', label: 'Container Security', type: 'recommended' },
      ]
    },
    {
      id: 'ci-cd',
      title: 'CI/CD Pipelines',
      color: '#16a34a',
      topics: [
        { id: 'github-actions', label: 'GitHub Actions', type: 'required' },
        { id: 'jenkins', label: 'Jenkins', type: 'optional' },
        { id: 'gitlab-ci', label: 'GitLab CI/CD', type: 'optional' },
        { id: 'argocd', label: 'ArgoCD (GitOps)', type: 'recommended' },
      ]
    },
    {
      id: 'cloud',
      title: 'Cloud Providers',
      color: '#f59e0b',
      topics: [
        { id: 'aws', label: 'AWS (EC2, S3, Lambda, RDS)', type: 'required' },
        { id: 'gcp', label: 'GCP (Google Cloud Platform)', type: 'optional' },
        { id: 'azure', label: 'Microsoft Azure', type: 'optional' },
        { id: 'serverless', label: 'Serverless Architecture', type: 'recommended' },
      ]
    },
    {
      id: 'iac',
      title: 'Infrastructure as Code',
      color: '#8b5cf6',
      topics: [
        { id: 'terraform', label: 'Terraform', type: 'required' },
        { id: 'ansible', label: 'Ansible', type: 'recommended' },
        { id: 'pulumi', label: 'Pulumi', type: 'optional' },
      ]
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Observability',
      color: '#ef4444',
      topics: [
        { id: 'prometheus', label: 'Prometheus & Grafana', type: 'required' },
        { id: 'elk', label: 'ELK Stack (Elasticsearch, Logstash, Kibana)', type: 'recommended' },
        { id: 'datadog', label: 'Datadog / New Relic', type: 'optional' },
        { id: 'tracing', label: 'Distributed Tracing (Jaeger / Zipkin)', type: 'optional' },
      ]
    },
    {
      id: 'security',
      title: 'DevSecOps & Security',
      color: '#ec4899',
      topics: [
        { id: 'vault', label: 'Secrets Management (HashiCorp Vault)', type: 'recommended' },
        { id: 'sast', label: 'SAST / DAST Scanning', type: 'recommended' },
        { id: 'network-security', label: 'Network Security & Firewalls', type: 'recommended' },
      ]
    },
  ]
}
