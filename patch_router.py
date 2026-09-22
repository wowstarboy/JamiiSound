import re
with open('src/router/Router.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { ChartScreen }" not in content:
    content = content.replace(
        "import { MenuView } from '../views/MenuView';",
        "import { MenuView } from '../views/MenuView';\nimport { ChartScreen } from '../views/ChartScreen';"
    )

# Add URL mapping
url_target = r"else if \(currentTab === 'menu'\) url = '/menu';"
url_replacement = "else if (currentTab === 'menu') url = '/menu';\n    else if (currentTab === 'charts') url = '/charts';"
if "currentTab === 'charts'" not in content:
    content = content.replace(url_target, url_replacement)

# Add routing initial check
initial_target = r"\} else if \(path === '/menu'\) \{\n      setCurrentTab\('menu'\);\n    \}"
initial_replacement = """} else if (path === '/menu') {
      setCurrentTab('menu');
    } else if (path === '/charts') {
      setCurrentTab('charts');
    }"""
if "path === '/charts'" not in content:
    content = content.replace(initial_target, initial_replacement)

# Add route switch case
switch_target = r"    case 'menu':\n      return \(\n        <div className=\"px-4 md:px-8 py-0\">\n          <MenuView \/>\n        <\/div>\n      \);"
switch_replacement = """    case 'menu':
      return (
        <div className="px-4 md:px-8 py-0">
          <MenuView />
        </div>
      );
    case 'charts':
      return <ChartScreen />;"""
if "case 'charts':" not in content:
    content = re.sub(switch_target, switch_replacement, content)

with open('src/router/Router.tsx', 'w') as f:
    f.write(content)
