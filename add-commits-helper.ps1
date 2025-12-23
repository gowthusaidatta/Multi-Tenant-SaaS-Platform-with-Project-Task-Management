# Script to Add Meaningful Commits
# This script will help you reach the 30-commit requirement with meaningful changes

Write-Host "=== Multi-Tenant SaaS - Commit Helper ===" -ForegroundColor Cyan
Write-Host ""

$repoPath = "C:\Users\saida\Desktop\Gpp\Multi-Tenant SaaS Platform with Project & Task Management"
Set-Location $repoPath

# Check current commit count
$commitCount = (git log --oneline | Measure-Object -Line).Lines
Write-Host "Current commits: $commitCount" -ForegroundColor Yellow
Write-Host "Target commits: 30" -ForegroundColor Green
Write-Host "Commits needed: $($30 - $commitCount)" -ForegroundColor $(if ($commitCount -lt 30) { "Red" } else { "Green" })
Write-Host ""

# Create incremental documentation improvements
$improvementsList = @(
    @{
        File = "backend\src\middleware\auth.js"
        Action = "Add detailed JSDoc comments"
        Message = "docs: add JSDoc documentation to auth middleware"
    },
    @{
        File = "backend\src\routes\auth.js"
        Action = "Add inline comments explaining tenant isolation"
        Message = "docs: document tenant isolation in auth routes"
    },
    @{
        File = "backend\src\routes\projects.js"
        Action = "Add JSDoc comments"
        Message = "docs: add JSDoc to project routes"
    },
    @{
        File = "backend\src\routes\tasks.js"
        Action = "Add JSDoc comments"
        Message = "docs: add JSDoc to task routes"
    },
    @{
        File = "docs\API.md"
        Action = "Add more request/response examples"
        Message = "docs: enhance API examples with error cases"
    },
    @{
        File = "docs\architecture.md"
        Action = "Add deployment architecture section"
        Message = "docs: add deployment architecture details"
    },
    @{
        File = "docs\technical-spec.md"
        Action = "Add troubleshooting section"
        Message = "docs: add troubleshooting guide"
    },
    @{
        File = "docs\PRD.md"
        Action = "Add user journey examples"
        Message = "docs: add user journey examples to PRD"
    },
    @{
        File = "backend\src\config.js"
        Action = "Add configuration comments"
        Message = "docs: document configuration options"
    },
    @{
        File = "frontend\src\api.js"
        Action = "Add JSDoc comments"
        Message = "docs: add JSDoc to API client"
    },
    @{
        File = "frontend\src\pages\Login.jsx"
        Action = "Add component documentation"
        Message = "docs: document Login component props and state"
    },
    @{
        File = "frontend\src\pages\Dashboard.jsx"
        Action = "Add component documentation"
        Message = "docs: document Dashboard component structure"
    },
    @{
        File = "README.md"
        Action = "Add troubleshooting section"
        Message = "docs: add troubleshooting guide to README"
    },
    @{
        File = "README.md"
        Action = "Add performance considerations"
        Message = "docs: add performance optimization notes"
    },
    @{
        File = "README.md"
        Action = "Add security best practices"
        Message = "docs: add security considerations section"
    },
    @{
        File = "docker-compose.yml"
        Action = "Add inline comments"
        Message = "docs: add comments explaining Docker services"
    },
    @{
        File = "backend\Dockerfile"
        Action = "Add build stage comments"
        Message = "docs: document Dockerfile build stages"
    },
    @{
        File = "frontend\Dockerfile"
        Action = "Add comments"
        Message = "docs: document frontend Dockerfile"
    },
    @{
        File = ".gitignore"
        Action = "Organize and comment sections"
        Message = "chore: organize gitignore with comments"
    },
    @{
        File = "package.json"
        Action = "Update description"
        Message = "chore: improve package description"
    }
)

Write-Host "=== Available Improvements ===" -ForegroundColor Cyan
for ($i = 0; $i -lt $improvementsList.Count; $i++) {
    $item = $improvementsList[$i]
    Write-Host "$($i + 1). $($item.File) - $($item.Action)" -ForegroundColor White
}
Write-Host ""
Write-Host "=== Instructions ===" -ForegroundColor Cyan
Write-Host "1. Make small improvements to the files listed above"
Write-Host "2. After each improvement, commit with the suggested message"
Write-Host "3. Example workflow:"
Write-Host "   - Edit backend\src\middleware\auth.js (add comments)"
Write-Host "   - git add backend\src\middleware\auth.js"
Write-Host "   - git commit -m 'docs: add JSDoc documentation to auth middleware'"
Write-Host ""
Write-Host "4. For bulk commits, you can also:"
Write-Host "   - Create CONTRIBUTING.md"
Write-Host "   - Create CODE_OF_CONDUCT.md"
Write-Host "   - Create CHANGELOG.md"
Write-Host "   - Add .github/workflows/ci.yml (even if basic)"
Write-Host "   - Create postman_collection.json"
Write-Host ""
Write-Host "=== Quick Win: Add Missing Files ===" -ForegroundColor Green
Write-Host "These files can be created and committed immediately:"
Write-Host ""

$quickFiles = @"
1. CONTRIBUTING.md - How to contribute to the project
2. CODE_OF_CONDUCT.md - Community guidelines
3. CHANGELOG.md - Version history
4. LICENSE - Project license (MIT recommended)
5. .dockerignore - Optimize Docker builds
6. .editorconfig - Consistent code style
7. postman_collection.json - Postman API tests
8. docs/DEPLOYMENT.md - Production deployment guide
9. docs/TESTING.md - Testing strategy
10. docs/SECURITY.md - Security considerations
"@

Write-Host $quickFiles -ForegroundColor Yellow
Write-Host ""
Write-Host "Would you like help creating these files? (Y/N)" -ForegroundColor Cyan
