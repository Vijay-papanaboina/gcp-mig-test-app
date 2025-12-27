packer {
  required_plugins {
    googlecompute = {
      source  = "github.com/hashicorp/googlecompute"
      version = ">= 1.0.0"
    }
  }
}

source "googlecompute" "app" {
  project_id              = "learning-gcp-22"
  zone                    = "asia-south1-c"
  source_image_family     = "ubuntu-2204-lts"
  source_image_project_id = ["ubuntu-os-cloud"]

  ssh_username = "packer"
  image_name   = "test-app-{{timestamp}}"
}

build {
  sources = ["source.googlecompute.app"]

  # First, create /opt/app with proper permissions so packer user can write to it
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/app",
      "sudo chown packer:packer /opt/app"
    ]
  }

  # Now copy files directly to /opt/app (no /tmp needed!)
  provisioner "file" {
    source      = "../"
    destination = "/opt/app"
  }

  # Copy systemd service file
  provisioner "file" {
    source      = "./test-app.service"
    destination = "/tmp/test-app.service"
  }

  # Install Node + setup app
  provisioner "shell" {
    inline = [
      "sudo apt update",

      # Install Node.js 20.x from NodeSource
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt install -y nodejs",

      # Install dependencies
      "cd /opt/app && npm install",

      # systemd service
      "sudo mv /tmp/test-app.service /etc/systemd/system/test-app.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable test-app.service"
    ]
  }
}
