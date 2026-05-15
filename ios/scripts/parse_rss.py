import xml.etree.ElementTree as ET
import json
import os
import re

file_path = '/Users/hoangnam/Developer/RustAlgorithmTrading/ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Fixtures/exploreswiftui_feed.xml'
output_path = '/Users/hoangnam/Developer/RustAlgorithmTrading/ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Fixtures/exploreswiftui_feed.json'

def parse_rss(xml_file):
    try:
        # RSS has namespaces
        namespaces = {
            'content': 'http://purl.org/rss/1.0/modules/content/'
        }
        
        tree = ET.parse(xml_file)
        root = tree.getroot()
        channel = root.find('channel')
        
        group_descriptions = {
            "Buttons": "API xoay quanh Button, buttonStyle, buttonBorderShape, role, tint, RenameButton, PasteButton; iOS 26 thêm buttonSizing và glass/glassProminent style.",
            "Toolbars": "API mới iOS 26 cho title placement (.title/.subtitle/.largeTitle/.largeSubtitle), ToolbarSpacer(.fixed/.flexible), và sharedBackgroundVisibility.",
            "Sliders": "nền tảng là Slider + step; iOS 26 thêm tick system (SliderTick, SliderTickContentForEach) để có mốc và label tick.",
            "Pickers": "1 API Picker, nhiều style (inline/menu/navigationLink/palette/segmented/wheel/radioGroup), thêm bố cục radio theo chiều ngang, và currentValueLabel ở API đời mới.",
            "Date Pickers": "DatePicker theo components/style (wheel/graphical/field/stepperField), range ngày (in:), và MultiDatePicker cho chọn nhiều ngày.",
            "Gauges": "Gauge với nhiều style (linear/circular/accessory...), hỗ trợ current/min/max label, tint/color.",
            "Progress Views": "ProgressView dạng linear/circular, có label và tint/styling.",
            "Content Unavailable Views": "UI trạng thái rỗng, gồm custom variant và search variant (ContentUnavailableView.search).",
            "Menus": "Menu, Section, Divider, menu lồng nhau, menuOrder(.fixed) và contextMenu (kể cả preview).",
            "View That Fits": "fallback layout tự động theo không gian hiển thị (ưu tiên view đầu tiên fit được).",
            "Dividers": "divider cơ bản, màu, chiều cao, và vertical usage trong HStack.",
            "Lists": "nhóm lớn nhất; gồm style list, separators, row/background/insets/spacing, swipe/refresh, badge, edit/move/delete control, section index, outline/disclosure.",
            "Group Boxes": "GroupBox cơ bản, có label, có backgroundStyle.",
            "Scroll Views": "iOS 26 có scrollEdgeEffectStyle(.hard) để edge effect cứng.",
            "Colors": "semantic/system colors, UIKit bridge colors (Color(.separator/.label/...)), gradient/opacity variants.",
            "Text": "formatted text (Text(value, format: ...)) kiểu currency/number.",
            "Material": "material styles (ultraThin/thin/regular/thick/...) dùng cho foreground/background effect.",
            "Links": "Link, ShareLink, HelpLink, TextFieldLink, kèm custom preview item cho share.",
            "Control Groups": "ControlGroup và các style (navigation/menu/compactMenu/palette).",
            "Navigation": "iOS 26 thêm navigationSubtitle (title + subtitle).",
            "Tab Views": "nhóm rất rộng; gồm Tab/TabSection, value-tab, search role, tabViewStyle variants (page/sidebarAdaptable/tabBarOnly/grouped), customization APIs, sidebar header/footer/bottombar, iOS 26 thêm bottom accessory + minimize tab bar on scroll.",
            "Views": "generic view-level APIs như containerBackground, controlSize, backgroundExtensionEffect, glassEffect.",
            "Glass Effect Containers": "container iOS 26 để gom nhiều glass elements và tối ưu compositing.",
            "Shapes": "ContainerRelativeShape cho shape bám theo container context.",
            "Labels": "Label với system image/custom image và label styles.",
            "Labeled Content": "cặp “title-value” cho form/list, có formatted value và custom content.",
            "Concentric Rectangles": "shape iOS 26 với concentric corners (uniform/non-uniform) cho style mới."
        }

        feed_info = {
            'title': channel.findtext('title'),
            'link': channel.findtext('link'),
            'description': channel.findtext('description'),
            'lastBuildDate': channel.findtext('lastBuildDate'),
            'group_descriptions': group_descriptions,
            'items': []
        }
        
        for index, item in enumerate(channel.findall('item'), 1):
            title = item.findtext('title')
            link = item.findtext('link')
            description = item.findtext('description')
            pubDate = item.findtext('pubDate')
            guid = item.findtext('guid')
            
            # Extract group from link
            group = "General"
            if link and '/library/' in link:
                group_match = re.search(r'/library/([^/]+)', link)
                if group_match:
                    group_raw = group_match.group(1).lower()
                    group_map = {
                        'button': "Buttons",
                        'tabview': "Tab Views",
                        'toolbars': "Toolbars",
                        'slider': "Sliders",
                        'picker': "Pickers",
                        'datepicker': "Date Pickers",
                        'gauge': "Gauges",
                        'progressview': "Progress Views",
                        'menu': "Menus",
                        'contentunavailableview': "Content Unavailable Views",
                        'viewthatfits': "View That Fits",
                        'divider': "Dividers",
                        'list': "Lists",
                        'groupbox': "Group Boxes",
                        'scrollview': "Scroll Views",
                        'color': "Colors",
                        'text': "Text",
                        'material': "Material",
                        'link': "Links",
                        'controlgroup': "Control Groups",
                        'navigation': "Navigation",
                        'view': "Views",
                        'glasseffectcontainer': "Glass Effect Containers",
                        'shapes': "Shapes",
                        'label': "Labels",
                        'labeledcontent': "Labeled Content",
                        'concentricrectangle': "Concentric Rectangles"
                    }
                    if group_raw in group_map:
                        group = group_map[group_raw]
                    else:
                        group = group_raw.replace('-', ' ').title()
                        if group not in ['Navigation', 'Text', 'Material', 'Divider', 'Gauge', 'Color']:
                            if not group.endswith('s'):
                                group += "s"
            
            # Extract content:encoded
            content_encoded = item.find('{http://purl.org/rss/1.0/modules/content/}encoded')
            content_text = content_encoded.text if content_encoded is not None else ""
            
            # Simple regex to extract compatibility and code
            compatibility = {}
            code = ""
            image_url = None
            
            if content_text:
                # Use html.unescape if possible, but for simple extraction we can be naive
                comp_match = re.search(r'<h4>Compatibility</h4><ul>(.*?)</ul>', content_text, re.DOTALL)
                if comp_match:
                    li_items = re.findall(r'<li>(.*?): (.*?)</li>', comp_match.group(1))
                    compatibility = {k: v for k, v in li_items}
                
                code_match = re.search(r'<pre><code class="language-swift">(.*?)</code></pre>', content_text, re.DOTALL)
                code = code_match.group(1).strip() if code_match else ""
                
                img_match = re.search(r'<img src="(.*?)"', content_text)
                image_url = img_match.group(1) if img_match else None

            feed_info['items'].append({
                'index': index,
                'group': group,
                'title': title,
                'link': link,
                'description': description,
                'pubDate': pubDate,
                'guid': guid,
                'compatibility': compatibility,
                'code': code,
                'image_url': image_url
            })
            
        return feed_info
    except Exception as e:
        return {"error": str(e)}

result = parse_rss(file_path)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f"Successfully saved {len(result.get('items', []))} items to {output_path}")

# Print group summary for verification
if 'items' in result:
    from collections import Counter
    counts = Counter(item['group'] for item in result['items'])
    print("\nGroup Summary:")
    for group, count in sorted(counts.items()):
        print(f"- {group}: {count} cases")
