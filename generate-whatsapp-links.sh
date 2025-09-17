#!/bin/bash

# WhatsApp Link Generator for EMS Team Sharing
# Generates clickable WhatsApp links for easy team sharing

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📱 WhatsApp Sharing Link Generator for EMS${NC}"
echo ""

# Function to URL encode text
urlencode() {
    local string="${1}"
    local strlen=${#string}
    local encoded=""
    local pos c o

    for (( pos=0 ; pos<strlen ; pos++ )); do
        c=${string:$pos:1}
        case "$c" in
            [-_.~a-zA-Z0-9] ) o="${c}" ;;
            * ) printf -v o '%%%02x' "'$c"
        esac
        encoded+="${o}"
    done
    echo "${encoded}"
}

# Generate WhatsApp share links
generate_links() {
    echo -e "${YELLOW}🔗 Generated WhatsApp Sharing Links:${NC}"
    echo ""
    
    # Message 1: Quick deployment
    MSG1="🎉 Employee Management System - Ready for Deployment!

Hi team! 👋 Our EMS Docker images are live on Docker Hub!

🔗 Repository: https://github.com/SanketsMane/Employee-Management-System_React
🐳 Docker Hub: https://hub.docker.com/u/sanketsmane

⚡ Quick Deploy:
1. Clone repo
2. Run: ./team-deploy.sh --prod
3. Access: http://localhost

📚 Quick Guide: https://github.com/SanketsMane/Employee-Management-System_React/blob/main/QUICK_START.md

Need help? Contact: contactsanket1@gmail.com

#EMS #Docker #TeamWork"
    
    ENCODED_MSG1=$(urlencode "$MSG1")
    LINK1="https://wa.me/?text=${ENCODED_MSG1}"
    
    echo -e "${GREEN}1. Quick Deployment Message:${NC}"
    echo "$LINK1"
    echo ""
    
    # Message 2: Technical details
    MSG2="🛠️ EMS Technical Deployment

✅ Docker Images Published:
• Backend: sanketsmane/ems-backend:latest
• Frontend: sanketsmane/ems-frontend:latest

🔧 Quick Commands:
docker pull sanketsmane/ems-backend:latest
docker pull sanketsmane/ems-frontend:latest

🆕 Features: Overtime tracking, Enhanced security

📦 Repo: https://github.com/SanketsMane/Employee-Management-System_React
🐳 Docker: https://hub.docker.com/u/sanketsmane

Questions? DM me! 💬"
    
    ENCODED_MSG2=$(urlencode "$MSG2")
    LINK2="https://wa.me/?text=${ENCODED_MSG2}"
    
    echo -e "${GREEN}2. Technical Details Message:${NC}"
    echo "$LINK2"
    echo ""
    
    # Message 3: Simple instructions
    MSG3="📋 Simple EMS Setup

Hey team! 👋 Easy Employee Management System setup:

🎁 Features:
• Employee management
• Attendance tracking  
• Leave management
• NEW: Overtime tracking

💻 Easy Setup:
1. Go to: https://github.com/SanketsMane/Employee-Management-System_React
2. Follow QUICK_START.md

🆘 Need help? contactsanket1@gmail.com

#EMS #Simple"
    
    ENCODED_MSG3=$(urlencode "$MSG3")
    LINK3="https://wa.me/?text=${ENCODED_MSG3}"
    
    echo -e "${GREEN}3. Simple Instructions Message:${NC}"
    echo "$LINK3"
    echo ""
    
    # Message 4: Links collection  
    MSG4="📚 EMS - All Important Links

🔗 Repository: https://github.com/SanketsMane/Employee-Management-System_React

🐳 Docker Images:
• Backend: https://hub.docker.com/r/sanketsmane/ems-backend
• Frontend: https://hub.docker.com/r/sanketsmane/ems-frontend

📖 Documentation:
• Quick Start: https://github.com/SanketsMane/Employee-Management-System_React/blob/main/QUICK_START.md
• Docker Guide: https://github.com/SanketsMane/Employee-Management-System_React/blob/main/DOCKER_DEPLOYMENT_GUIDE.md

📧 Support: contactsanket1@gmail.com

Save these links! 📌"
    
    ENCODED_MSG4=$(urlencode "$MSG4")
    LINK4="https://wa.me/?text=${ENCODED_MSG4}"
    
    echo -e "${GREEN}4. Links Collection Message:${NC}"
    echo "$LINK4"
    echo ""
}

# Generate QR codes (if qrencode is available)
generate_qr_codes() {
    if command -v qrencode &> /dev/null; then
        echo -e "${YELLOW}📱 Generating QR Codes for easy mobile sharing...${NC}"
        
        # QR for repository
        echo "https://github.com/SanketsMane/Employee-Management-System_React" | qrencode -t ANSIUTF8
        echo "Repository QR Code ↑"
        echo ""
        
        # QR for quick start
        echo "https://github.com/SanketsMane/Employee-Management-System_React/blob/main/QUICK_START.md" | qrencode -t ANSIUTF8
        echo "Quick Start Guide QR Code ↑"
        echo ""
    else
        echo -e "${YELLOW}💡 Install qrencode for QR code generation: brew install qrencode${NC}"
    fi
}

# Generate WhatsApp group invite helper
generate_group_helper() {
    echo -e "${YELLOW}👥 WhatsApp Group Setup Helper:${NC}"
    echo ""
    echo "To create a deployment support group:"
    echo "1. Create WhatsApp group: 'EMS Deployment Team'"
    echo "2. Add team members"
    echo "3. Pin this message:"
    echo ""
    echo "📌 EMS Deployment Resources"
    echo "• Repository: https://github.com/SanketsMane/Employee-Management-System_React"
    echo "• Quick Start: Run ./team-deploy.sh --prod"
    echo "• Support: @sanket (contactsanket1@gmail.com)"
    echo "• Status: Ready for deployment ✅"
    echo ""
}

# Generate contact card
generate_contact_card() {
    echo -e "${YELLOW}👤 Developer Contact Card (Share this):${NC}"
    echo ""
    echo "📇 Sanket Mane - EMS Developer"
    echo "📧 Email: contactsanket1@gmail.com"
    echo "🐙 GitHub: https://github.com/SanketsMane"
    echo "🐳 Docker Hub: https://hub.docker.com/u/sanketsmane"
    echo "💼 Project: Employee Management System"
    echo "🚀 Status: Available for deployment support"
    echo ""
    echo "WhatsApp Contact Link:"
    echo "https://wa.me/YOUR_PHONE_NUMBER?text=Hi%20Sanket%2C%20I%20need%20help%20with%20EMS%20deployment"
    echo ""
    echo "💡 Replace YOUR_PHONE_NUMBER with your actual WhatsApp number"
}

# Main menu
show_menu() {
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1. Generate WhatsApp sharing links"
    echo "2. Generate QR codes"
    echo "3. Group setup helper"
    echo "4. Contact card"
    echo "5. All of the above"
    echo "6. Exit"
    echo ""
    read -p "Enter choice (1-6): " choice
    
    case $choice in
        1) generate_links ;;
        2) generate_qr_codes ;;
        3) generate_group_helper ;;
        4) generate_contact_card ;;
        5) 
            generate_links
            echo ""
            generate_qr_codes
            echo ""
            generate_group_helper
            echo ""
            generate_contact_card
            ;;
        6) echo "👋 Happy sharing!" && exit 0 ;;
        *) echo "Invalid choice" && show_menu ;;
    esac
}

# Run the menu
show_menu

echo ""
echo -e "${GREEN}🎉 WhatsApp sharing resources generated!${NC}"
echo -e "${BLUE}💡 Tip: Copy the links and paste them directly in WhatsApp${NC}"