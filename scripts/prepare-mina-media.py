"""Embed this work's local media in the framework's validated story format."""
from pathlib import Path
import json
import base64

root = Path(__file__).resolve().parents[1]
media = root / 'public' / 'mina-media'
story_file = root / 'stories' / 'template' / 'story.json'
story = json.loads(story_file.read_text())

def data(path, mime=None):
    mime = mime or ('image/png' if path.suffix == '.png' else 'image/jpeg')
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

portrait = data(media / 'portrait.jpg')
images = {'portrait': portrait, **{f'lifestyle{i}': data(media / 'cards' / f'lifestyle{i}.jpg') for i in range(1, 6)}}
products = {
    'amazonjp-mugs':'mugs', 'amazonjp-film':'album', 'amazonjp-lamp':'lamp', 'amazonjp-order-tea':'tea',
    'rakuten-scarf':'scarf', 'rakuten-umbrella':'umbrella', 'rakuten-dish':'plates', 'rakuten-order-socks':'socks',
    'qoo10-handcream':'cream', 'qoo10-pouch':'pouch', 'qoo10-clips':'clips', 'qoo10-order-mask':'mask',
    'coupang-soup':'soup', 'coupang-slippers':'slippers', 'coupang-water':'water', 'coupang-order-blanket':'blanket',
    'musinsa-hoodie':'hoodie', 'musinsa-cap':'cap', 'musinsa-tote':'tote', 'musinsa-order-knit':'knit',
    'photo-cups':'mugs',
}
for app in story['installedApps']:
    if isinstance(app, dict) and app['id'] == 'bubble' and (media / 'bubble' / 'icon-reference.jpg').exists():
        app['icon'] = data(media / 'bubble' / 'icon-reference.jpg')
    elif isinstance(app, dict) and (media / 'icons' / f"{app['id']}.png").exists():
        app['icon'] = data(media / 'icons' / f"{app['id']}.png")

for app, records in story['content'].items():
    for item in records:
        key = item.get('meta', {}).get('imageKey')
        if app in ('music', 'spotify'):
            number = int(item['id'].split('-')[-1])
            item['media'] = data(media / 'audio' / f'ambient{number}.ogg', 'audio/ogg')
            item['meta']['duration'] = '00:24'
            item['sender'] = 'AFTER HOURS · Original ambient'
            item['meta']['album'] = '夜の余白'
        elif item['id'] in products:
            item['media'] = data(media / 'products' / f"{products[item['id']]}.png")
        elif key in images:
            item['media'] = images[key]
        if app in ('instagram', 'twitter') and item.get('sender', '').lower().startswith('mina'):
            item['avatar'] = portrait

for chat in story['chats']:
    if chat['app'] == 'bubble':
        for message in chat['messages']:
            if message.get('senderId') == 'owner':
                message['avatar'] = portrait
                break

photos = {i['id']: i for i in story['content']['photos']}
captions = {
    'photo-portrait': ('ある日のライト', 'まぶしい場所と、落ち着く場所。どちらも大事にしたい。'),
    'photo-window': ('いつもの一杯', '少し甘くしたコーヒー。今日は、急がず飲めた。'),
    'photo-leaf': ('好きな色', 'やっぱり、手が伸びるのはこの色。冬はあたたかいものがいい。'),
    'photo-home': ('おうちの色', '落ち着く色。隣に置く、もう一枚も。'),
    'photo-film': ('もう一回だけ', '「これが最後」って言ったのに、どっちもコントローラーを置かなかった。'),
    'photo-travel': ('帰り道の空', '同じ空を見ていたらいいな、と思って送った。'),
    'photo-hidden': ('となりの席', '写真には写らない。君が座った側だけ、いつも少しあたたかい。'),
}
for item_id, (title, body) in captions.items():
    photos[item_id]['title'], photos[item_id]['body'] = title, body
photos['photo-leaf']['media'] = images['lifestyle5']
photos['photo-home']['media'] = images['lifestyle3']
photos['photo-film']['media'] = images['lifestyle2']
photos['photo-travel']['media'] = images['lifestyle4']
photos['photo-hidden']['media'] = images['lifestyle1']

localized = {
    'amazonjp-mugs': ('二色のマグカップ・2個セット', '深い緑とアイボリー。何度見ても、やっぱりこの組み合わせが好き。'),
    'amazonjp-film': ('小さなフォトアルバム', 'すぐ見返せるところに、好きな一枚を。'),
    'amazonjp-lamp': ('あたたかな読書灯', '同じソファまで届くくらいの、やさしい明かり。'),
    'amazonjp-order-tea': ('ほうじ茶・20包', '練習のあとに、温かいものを一杯。'),
    'rakuten-scarf': ('ウールマフラー・グレー／アイボリー', '同じ色にしたら、気づいてくれるかな。まだお気に入りの中。'),
    'rakuten-umbrella': ('二人用の軽い長傘', 'どちらの肩も、ぬれないくらい。'),
    'rakuten-dish': ('小さなプレート・2枚セット', 'いつものデザートを、半分ずつ。'),
    'rakuten-order-socks': ('ふわふわルームソックス', '今日はちゃんと、あたたかくして帰ろう。'),
    'qoo10-handcream': ('無香料ハンドクリーム・2本', '一本はバッグに。もう一本は、君に。'),
    'qoo10-pouch': ('キルティングポーチ・ミント', 'イヤホンとヘアゴム、いつも探しているリップ。'),
    'qoo10-clips': ('シンプルヘアクリップ・3本', '練習のとき、前髪を少し留めたいだけ。'),
    'qoo10-order-mask': ('うるおいシートマスク・10枚', '今日は早めに、休む日にしよう。'),
    'coupang-soup': ('단호박 수프 · 2인분', '같이 밥 먹는 시간을 조금 더 남겨 두고 싶어서.'),
    'coupang-slippers': ('포근한 실내화 · 아이보리 / 그레이', '사이즈는 직접 골라 줬으면 좋겠다.'),
    'coupang-water': ('생수 500ml · 20병', '연습실에 둘 물. 빈 병은 꼭 정리하기.'),
    'coupang-order-blanket': ('소파 블랭킷 · 세이지', '어제 고른 영화와 잘 어울릴 것 같아.'),
    'musinsa-hoodie': ('베이직 후드 · 차콜', '조금 넉넉한 핏. 너한테도 잘 어울릴 것 같아.'),
    'musinsa-cap': ('로고 없는 볼캡 · 블랙', '특별한 무늬 없이, 편안하게.'),
    'musinsa-tote': ('캔버스 토트백 · 딥그린', '머플러 두 개가 딱 들어가는 크기.'),
    'musinsa-order-knit': ('소프트 니트 카디건 · 크림', '쌀쌀한 날엔 가볍게 걸칠 수 있도록.'),
}
for records in story['content'].values():
    for item in records:
        if item['id'] in localized:
            item['title'], item['body'] = localized[item['id']]

for item in story['content']['notes']:
    if item['id'] == 'note-about':
        credit = '\n\n素材署名：Mina H&M Rokh 2 — TV10，CC BY 3.0。\nhttps://commons.wikimedia.org/wiki/File:Mina_H%26M_Rokh_2.jpg\nhttps://creativecommons.org/licenses/by/3.0/\n展示时可能裁切。其余照片为示意静物；商品配图和器乐片段为本作原创。\n完整来源：mina-media/credits.html\n框架：FoundPhone Studio — MIT License。'
        if '素材署名：' not in item['body'] and '素材クレジット：' not in item['body']:
            item['body'] += credit

temporary = story_file.with_suffix('.tmp')
temporary.write_text(json.dumps(story, ensure_ascii=False, indent=2) + '\n')
temporary.replace(story_file)
print(f'Embedded media; story source {story_file.stat().st_size:,} bytes.')
