# 1. Remove the old apt-installed nodejs and npm
sudo apt-get purge -y nodejs npm
sudo apt-get autoremove -y

# 2. Install curl if you don't have it
sudo apt-get update
sudo apt-get install -y curl ca-certificates gnupg

# 3. Download and execute the NodeSource setup script for Node.js 22 (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# 4. Install the updated Node.js (this includes npm)
sudo apt-get install -y nodejs

# 5. Verify the installation
echo -e "\n--- Verification ---"
node -v
npm -v
