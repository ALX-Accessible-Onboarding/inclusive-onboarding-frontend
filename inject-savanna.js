const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\HP\\projects\\Savanna-static-pages\\pages';
const files = [
  'concept-with-navigation.html',
  'homepage-v1-paced.html',
  'homepage-v1-self-paced.html'
];

const cssLink = '    <link rel="stylesheet" href="../assets/inclusive-kit/ik-base.css" media="all" />\n';

const navItem = `          <li id="sidebar-accessible-onboarding">
            <a href="javascript:void(0)" id="btn-accessible-onboarding" rel="noreferrer" target="_self" aria-label="Open Accessible Onboarding and Career Gateway">
              <div class="icon" style="color: #0045f5"><i aria-hidden="true" class="fa-solid fa-universal-access"></i></div>
              <div class="ps-3 overflow-hidden text-nowrap" style="display: block; font-weight: 700; color: #0045f5">Accessible onboarding</div>
            </a>
          </li>\n`;

const mountAndScript = `
    <!-- Savanna Inclusive Access Kit Mount -->
    <div id="inclusive-kit-mount"></div>
    <script src="../assets/inclusive-kit/inclusive-kit.js" defer></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('btn-accessible-onboarding');
        if (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (window.InclusiveKit) {
              window.InclusiveKit.openModal({
                apiBaseUrl: 'https://inclusive-onboarding-backend.onrender.com/api',
                mode: 'live',
                initialView: 'onboarding',
                language: 'en',
                learnerId: 'lrn_demo'
              });
            }
          });
        }
      });
    </script>
`;

files.forEach(filename => {
  const filePath = path.join(targetDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Inject CSS in head if not present
  if (!content.includes('inclusive-kit/ik-base.css')) {
    content = content.replace('</head>', cssLink + '  </head>');
  }

  // 2. Inject nav item if not present
  if (!content.includes('sidebar-accessible-onboarding')) {
    // Insert after "Access my learning" </li>
    const target = 'Access my learning</div></a>\n            >\n          </li>';
    const altTarget = 'Access my learning</div></a>\n          </li>';
    if (content.includes(target)) {
      content = content.replace(target, target + '\n' + navItem);
    } else if (content.includes(altTarget)) {
      content = content.replace(altTarget, altTarget + '\n' + navItem);
    } else {
      // Fallback: insert after <ul class="px-2">
      content = content.replace('<ul class="px-2">', '<ul class="px-2">\n' + navItem);
    }
  }

  // 3. Inject mount div and script before </body> if not present
  if (!content.includes('inclusive-kit-mount')) {
    content = content.replace('</body>', mountAndScript + '  </body>');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated:', filename);
});

