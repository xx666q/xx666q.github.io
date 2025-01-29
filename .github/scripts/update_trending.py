import requests
from bs4 import BeautifulSoup
import re

def get_trending_repos():
    url = 'https://github.com/trending?since=weekly'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    repos = []
    for article in soup.select('article.Box-row')[:3]:  # 获取前3个仓库
        name = article.select_one('h2 a').text.strip().replace('\n', '').replace(' ', '')
        description = article.select_one('p')
        description = description.text.strip() if description else ''
        
        stats = article.select('div.f6 a')
        stars = stats[0].text.strip()
        forks = stats[1].text.strip()
        
        language = article.select_one('span[itemprop="programmingLanguage"]')
        language = language.text.strip() if language else ''
        
        # 获取语言对应的颜色
        lang_color = article.select_one('span.repo-language-color')
        color = lang_color.get('style', '').replace('background-color: ', '') if lang_color else '#858585'
        
        repos.append({
            'name': name,
            'description': description,
            'stars': stars,
            'forks': forks,
            'language': language,
            'color': color,
            'url': f'https://github.com/{name}'
        })
    
    return repos

def update_html_content(repos):
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 生成新的卡片HTML
    new_cards = ''
    for repo in repos:
        new_cards += f'''
        <div class="github-card">
            <div class="repo-header">
                <i class="fas fa-star"></i>
                <a href="{repo['url']}" target="_blank">{repo['name']}</a>
            </div>
            <p class="repo-desc">{repo['description']}</p>
            <div class="repo-stats">
                <span><i class="fas fa-star"></i> {repo['stars']}</span>
                <span><i class="fas fa-code-branch"></i> {repo['forks']}</span>
                <span class="language"><span class="lang-color" style="background-color: {repo['color']}"></span>{repo['language']}</span>
            </div>
        </div>
        '''
    
    # 使用正则表达式替换现有卡片
    pattern = r'<div class="trending-grid">(.*?)</div>\s*<div class="trending-footer">'
    replacement = f'<div class="trending-grid">{new_cards}</div><div class="trending-footer">'
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    try:
        repos = get_trending_repos()
        if repos:
            update_html_content(repos)
            print("Successfully updated GitHub trending repositories")
        else:
            print("No repositories found")
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise e 