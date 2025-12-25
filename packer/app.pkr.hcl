packer {
  required_plugins {
    googlecompute = {
      source  = "github.com/hashicorp/googlecompute"
      version = ">= 1.0.0"
    }
  }
}

source "googlecompute" "app" {
  project_id          = "learning-gcp-22"
  zone                = "asia-south1-c"
  source_image_family = "ubuntu-2204-lts"
  source_image_project_id = ["ubuntu-os-cloud"]

  ssh_username        = "packer"
  image_name          = "test-app-{{timestamp}}"
}

build {
  sources = ["source.googlecompute.app"]

  # Copy app
  provisioner "file" {
    source      = "../app"
    destination = "/opt/app"
  }

  # Install Node + systemd service
  provisioner "shell" {
    inline = [
      "apt update",
      "apt install -y nodejs npm",

      "cd /opt/app",
      "npm install",

      # systemd service
      "cat <<'EOF' > /etc/systemd/system/test-app.service",
      "[Unit]",
      "Description=Test App",
      "After=network.target",
      "",
      "[Service]",
      "ExecStart=/usr/bin/node /opt/app/app.js",
      "Restart=always",
      "",
      "[Install]",
      "WantedBy=multi-user.target",
      "EOF",

      "systemctl daemon-reload",
      "systemctl enable test-app.service"
    ]
  }
}
