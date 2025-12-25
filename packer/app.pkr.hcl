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
  
  # Faster build VM (doesn't affect final instances)
  machine_type = "n2-standard-2"
  disk_size    = 15
  disk_type    = "pd-standard"

  ssh_username = "packer"
  image_name   = "test-app-{{timestamp}}"
}

build {
  sources = ["source.googlecompute.app"]

  # Copy app files
  provisioner "file" {
    source      = "../main.js"
    destination = "/tmp/main.js"
  }

  provisioner "file" {
    source      = "../package.json"
    destination = "/tmp/package.json"
  }

  provisioner "file" {
    source      = "../package-lock.json"
    destination = "/tmp/package-lock.json"
  }

  # Install Node + systemd service
  provisioner "shell" {
    inline = [
      "sudo apt update",
      
      # Install Node.js 20.x from NodeSource
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt install -y nodejs",

      "sudo mkdir -p /opt/app",
      "sudo mv /tmp/main.js /opt/app/",
      "sudo mv /tmp/package.json /opt/app/",
      "sudo mv /tmp/package-lock.json /opt/app/",
      "cd /opt/app",
      "sudo npm install",

      # systemd service
      "sudo bash -c 'printf \"[Unit]\\nDescription=Test App\\nAfter=network.target\\n\\n[Service]\\nExecStart=/usr/bin/node /opt/app/main.js\\nRestart=always\\n\\n[Install]\\nWantedBy=multi-user.target\\n\" > /etc/systemd/system/test-app.service'",

      "sudo systemctl daemon-reload",
      "sudo systemctl enable test-app.service"
    ]
  }
}
