import re
with open('src/components/MobileNav.tsx', 'r') as f:
    content = f.read()

target = """      <button
        id="mobile-nav-chart"
        aria-label="Charts"
        className="flex items-center justify-center p-3 rounded-full transition-colors text-white"
        onClick={() => {
          setCurrentTab('home');
          const chartsEl = document.getElementById('home-top-charts');
          if (chartsEl) {
            chartsEl.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >"""

replacement = """      <button
        id="mobile-nav-chart"
        aria-label="Charts"
        className="flex items-center justify-center p-3 rounded-full transition-colors text-white"
        onClick={() => setCurrentTab('charts')}
      >"""

content = content.replace(target, replacement)

# Add active class for chart
active_chart_target = r"<BarChart2 className=\"w-6 h-6 text-white\" \/>"
active_chart_replacement = "<BarChart2 className={`w-6 h-6 text-white ${currentTab === 'charts' ? 'fill-white' : ''}`} />"
content = content.replace(active_chart_target, active_chart_replacement)

with open('src/components/MobileNav.tsx', 'w') as f:
    f.write(content)
