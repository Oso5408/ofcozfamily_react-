#!/bin/bash

# =============================================
# Deploy Clear Expired Packages Edge Function
# =============================================
# Quick deployment script for the auto-clear system
# =============================================

set -e  # Exit on any error

echo "🚀 Deploying Clear Expired Packages System"
echo "=========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  macOS/Linux: brew install supabase/tap/supabase"
    echo "  npm: npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase!"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Check if project is linked
echo "🔗 Checking project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked yet"
    echo ""
    echo "Please link your project first:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Would you like to link now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase link
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo "✅ Project linked"
echo ""

# Deploy the Edge Function
echo "📦 Deploying Edge Function..."
echo ""
supabase functions deploy clear-expired-packages

echo ""
echo "✅ Edge Function deployed successfully!"
echo ""

# Get project info
PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d'"' -f2)
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/clear-expired-packages"

echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "Your function is now live at:"
echo "  $FUNCTION_URL"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Test the function manually:"
echo "   curl -X POST \\"
echo "     -H \"Authorization: Bearer YOUR_ANON_KEY\" \\"
echo "     $FUNCTION_URL"
echo ""
echo "2. Set up GitHub Actions for daily execution:"
echo "   - Add secrets to GitHub: SUPABASE_URL, SUPABASE_ANON_KEY"
echo "   - Push .github/workflows/clear-expired-packages.yml"
echo "   - Go to Actions tab and test manually"
echo ""
echo "3. View function logs:"
echo "   supabase functions logs clear-expired-packages"
echo ""
echo "📖 Full guide: See DEPLOY-CLEAR-EXPIRED-PACKAGES.md"
echo ""
