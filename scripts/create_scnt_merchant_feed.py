import os
import urllib.parse
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

# SCNT Product Data
scnt_products = [
    {
        "name": "Azure Code",
        "slug": "azure-code",
        "sku_code": "AZR",
        "collection": "The Executive",
        "collectionSlug": "executive",
        "inspired_from": "Bleu de Chanel Eau de Parfum",
        "gender": "male",
        "color": "Executive Navy / Slate Blue",
        "scent_family": "Woody Aromatic",
        "topNotes": ["Grapefruit", "Lemon", "Mint", "Pink Pepper"],
        "heartNotes": ["Ginger", "Nutmeg", "Jasmine", "Iso E Super"],
        "baseNotes": ["Incense", "Vetiver", "Cedar", "Sandalwood", "Patchouli", "Labdanum"],
        "description": "Clean, woody, slightly spicy; very versatile with a confident executive vibe. Crafted with high oil concentration in Egypt for long-lasting sillage.",
        "ar_name": "أزور كود",
        "ar_inspired": "بلو دي شانيل أو دو بارفام",
        "ar_description": "رائحة خشبية نظيفة وحارة قليلاً؛ متعددة الاستخدامات مع طابع تنفيذي واثق. تركيز أو دو بارفام عالي الثبات مصنع في مصر.",
        "front_image": "/Products/The Executive Collection Azure Code Bottle Mockup (Front).png",
        "back_image": "/Products/The Executive Collection Azure Code Bottle Mockup (Back).png",
        "clear_image": "/Products/The Executive Collection Azure Code Bottle Mockup (Clear)(Front).png",
        "box_image": "/Products/The Executive Collection Box Mockup.png",
    },
    {
        "name": "Deep Horizon",
        "slug": "deep-horizon",
        "sku_code": "DPH",
        "collection": "The Explorer",
        "collectionSlug": "explorer",
        "inspired_from": "Acqua di Gio Profondo",
        "gender": "male",
        "color": "Ocean Deep Blue / Cyan",
        "scent_family": "Aromatic Aquatic",
        "topNotes": ["Sea Notes", "Aquozone", "Bergamot", "Green Mandarin"],
        "heartNotes": ["Rosemary", "Lavender", "Cypress", "Mastic (Lentisque)"],
        "baseNotes": ["Mineral Notes", "Musk", "Patchouli", "Amber"],
        "description": "Fresh, marine, and aromatic with a deep mineral masculine dry-down. Inspired by oceanic freedom and open horizons.",
        "ar_name": "ديب هورايزون",
        "ar_inspired": "أكوا دي جيو بروفوندو",
        "ar_description": "رائحة بحرية منعشة وعطرية مع قاعدة معدنية ذكورية عميقة. مستوحاة من هواء البحر والأفق المفتوح.",
        "front_image": "/Products/The Explorer Collection Deep Horizon Bottle Mockup (Front).png",
        "back_image": "/Products/The Explorer Collection Deep Horizon Bottle Mockup (Back).png",
        "clear_image": "/Products/The Explorer Collection Deep Horizon Bottle Mockup (Clear)(Front).png",
        "box_image": "",
    },
    {
        "name": "Cobalt Drive",
        "slug": "cobalt-drive",
        "sku_code": "CBL",
        "collection": "The Executive",
        "collectionSlug": "executive",
        "inspired_from": "Y Eau de Parfum",
        "gender": "male",
        "color": "Cobalt Blue / Steel",
        "scent_family": "Aromatic Fougère",
        "topNotes": ["Apple", "Ginger", "Bergamot"],
        "heartNotes": ["Sage", "Juniper Berries", "Geranium"],
        "baseNotes": ["Amberwood", "Tonka Bean", "Cedar", "Vetiver", "Olibanum"],
        "description": "Fresh-sweet opening with a crisp apple accord and strong modern woody masculine base. Tailored for dynamic momentum.",
        "ar_name": "كوبالت درايف",
        "ar_inspired": "واي أو دو بارفام",
        "ar_description": "افتتاحية منعشة وحلوة مع تفاح مقرمش وقاعدة خشبية ذكورية حديثة وقوية تناسب الإيقاع السريع والحضور الواثق.",
        "front_image": "/Products/The Executive Collection Cobalt Drive Bottle Mockup (Front).png",
        "back_image": "/Products/The Executive Collection Cobalt Drive Bottle Mockup (Back).png",
        "clear_image": "/Products/The Executive Collection Cobalt Drive Bottle Mockup (Clear)(Front).png",
        "box_image": "/Products/The Executive Collection Box Mockup.png",
    },
    {
        "name": "Tropical Drift",
        "slug": "tropical-drift",
        "sku_code": "TRP",
        "collection": "The Explorer",
        "collectionSlug": "explorer",
        "inspired_from": "Le Beau Paradise Garden",
        "gender": "male",
        "color": "Tropical Green / Turquoise",
        "scent_family": "Aquatic Green Gourmand",
        "topNotes": ["Green Notes", "Watery Notes", "Mint", "Ginger"],
        "heartNotes": ["Coconut", "Fig", "Salt"],
        "baseNotes": ["Tonka Bean", "Sandalwood"],
        "description": "Fresh tropical air blended with creamy coconut, green fig and soft woods — vibrant, smooth, and effortlessly relaxed.",
        "ar_name": "تروبيكال دريفت",
        "ar_inspired": "لو بو بارادايس جاردن",
        "ar_description": "هواء استوائي منعش ممزوج بجوز الهند الكريمي والتين والأخشاب الناعمة — حيوي، ناعم، ومريح بامتياز.",
        "front_image": "/Products/The Explorer Collection Tropical Drift Bottle Mockup (Front).png",
        "back_image": "/Products/The Explorer Collection Tropical Drift Bottle Mockup (Back).png",
        "clear_image": "/Products/The Explorer Collection Tropical Drift Bottle Mockup (Clear)(Front).png",
        "box_image": "",
    },
    {
        "name": "Noir Velvet",
        "slug": "noir-velvet",
        "sku_code": "NRV",
        "collection": "The Charmer",
        "collectionSlug": "charmer",
        "inspired_from": "Dior Homme Intense",
        "gender": "male",
        "color": "Velvet Noir / Plum",
        "scent_family": "Woody Floral Musk",
        "topNotes": ["Lavender"],
        "heartNotes": ["Iris", "Ambrette (Musk Mallow)", "Pear"],
        "baseNotes": ["Vetiver", "Virginia Cedar"],
        "description": "Soft, powdery iris wrapped in a smooth woody base — intimate, elegant, and quietly seductive with refined dusk warmth.",
        "ar_name": "نوار فيلفيت",
        "ar_inspired": "ديور هوم إنتنس",
        "ar_description": "سوسن ناعم وبودري مغلف بقاعدة خشبية ناعمة — حميمي، أنيق، وجذاب بهدوء مع دفء المساء الراقي.",
        "front_image": "/Products/The Charmer Collection Noir Velvet Bottle Mockup (Front).png",
        "back_image": "/Products/The Charmer Collection Noir Velvet Bottle Mockup (Back).png",
        "clear_image": "/Products/The Charmer Collection Noir Velvet Bottle Mockup (Clear)(Front).png",
        "box_image": "/Products/The Charmer Collection Box Mockup.png",
    },
    {
        "name": "Amber Rush",
        "slug": "amber-rush",
        "sku_code": "AMB",
        "collection": "The Charmer",
        "collectionSlug": "charmer",
        "inspired_from": "Stronger With You Intensely",
        "gender": "male",
        "color": "Warm Amber / Cognac",
        "scent_family": "Amber Spicy Gourmand",
        "topNotes": ["Pink Pepper", "Juniper", "Violet"],
        "heartNotes": ["Toffee", "Cinnamon", "Lavender", "Sage"],
        "baseNotes": ["Vanilla", "Tonka Bean", "Amber", "Suede"],
        "description": "Warm, sweet, and addictive — a rich amber-vanilla composition with toffee and cinnamon for a bold, magnetic presence.",
        "ar_name": "عنبر راش",
        "ar_inspired": "سترونجر ويذ يو إنتنسلي",
        "ar_description": "دافئ، حلو، وآسر — تركيبة غنية من العنبر والفانيليا مع التوفي والقرفة لحضور جريء ومغناطيسي.",
        "front_image": "/Products/The Charmer Collection Amber Rush Bottle Mockup (Front).png",
        "back_image": "/Products/The Charmer Collection Amber Rush Bottle Mockup (Back).png",
        "clear_image": "/Products/The Charmer Collection Amber Rush Bottle Mockup (Clear)(Front).png",
        "box_image": "/Products/The Charmer Collection Box Mockup.png",
    },
    {
        "name": "Golden Bloom",
        "slug": "golden-bloom",
        "sku_code": "GLD",
        "collection": "The Icon",
        "collectionSlug": "icon",
        "inspired_from": "La Vie Est Belle",
        "gender": "female",
        "color": "Iconic Gold / Blush Pink",
        "scent_family": "Floral Fruity Gourmand",
        "topNotes": ["Black Currant", "Pear"],
        "heartNotes": ["Iris", "Jasmine", "Orange Blossom"],
        "baseNotes": ["Praline", "Vanilla", "Patchouli", "Tonka Bean"],
        "description": "Sweet, feminine, gourmand-floral signature with radiant elegance, praline sweetness and rich patchouli warmth.",
        "ar_name": "جولدن بلوم",
        "ar_inspired": "لا في إي بيل",
        "ar_description": "توقيع أنثوي حلو وغورماند زهري مع إشراقة زهر البرتقال وحلوى اللوز الدافئة لحضور متألق لا يُنسى.",
        "front_image": "/Products/The Icon Collection Golden Bloom Bottle Mockup (Front).png",
        "back_image": "/Products/The Icon Collection Golden Bloom Bottle Mockup (Back).png",
        "clear_image": "/Products/The Icon Collection Golden Bloom Bottle Mockup (Clear)(Front).png",
        "box_image": "",
    },
    {
        "name": "Lumiere",
        "slug": "lumiere",
        "sku_code": "LMR",
        "collection": "The Icon",
        "collectionSlug": "icon",
        "inspired_from": "Libre Eau de Parfum",
        "gender": "female",
        "color": "Solar Gold / Crystal",
        "scent_family": "Amber Floral",
        "topNotes": ["Lavender", "Mandarin Orange", "Black Currant", "Petitgrain"],
        "heartNotes": ["Jasmine", "Orange Blossom"],
        "baseNotes": ["Madagascar Vanilla", "Musk", "Cedar", "Ambergris"],
        "description": "Floral aromatic profile balancing daring French lavender with sensual Moroccan orange blossom and rich Madagascar vanilla.",
        "ar_name": "لوميير",
        "ar_inspired": "ليبر أو دو بارفام",
        "ar_description": "مزيج عطري زهري يجمع بين الخزامى الفرنسية وزهر البرتقال المغربي الحسي مع لمسة فانيليا مدغشقر والمسك الفاخر.",
        "front_image": "/Products/The Icon Collection Lumiere Bottle Mockup (Front).png",
        "back_image": "/Products/The Icon Collection Lumiere Bottle Mockup (Back).png",
        "clear_image": "/Products/The Icon Collection Lumiere Bottle Mockup (Clear)(Front).png",
        "box_image": "",
    },
]

BASE_URL = "https://www.scnt-eg.me"

def encode_img_url(path):
    if not path:
        return ""
    # Encode spaces and special chars in image paths
    quoted = urllib.parse.quote(path)
    return f"{BASE_URL}{quoted}"

# Generate 16 variant rows (50ml & 100ml for each of the 8 products)
def generate_scnt_feed_rows(is_arabic=False):
    rows = []
    for p in scnt_products:
        item_group_id = f"SCNT-{p['sku_code']}"
        
        # 50ml Variant
        sku_50 = f"SCNT-{p['sku_code']}-50ML"
        price_50 = "500.00 EGP"
        cogs_50 = "135.00 EGP" # Based on SCNT CostConfig: Bottle 28 + Box 16 + Sticker 5 + Alcohol 7 + Oil ~79
        
        # 100ml Variant
        sku_100 = f"SCNT-{p['sku_code']}-100ML"
        price_100 = "750.00 EGP"
        cogs_100 = "195.00 EGP" # Bottle 38 + Box 22 + Sticker 5 + Alcohol 15 + Oil ~115

        img_main = encode_img_url(p["front_image"])
        add_imgs = [encode_img_url(p["back_image"]), encode_img_url(p["clear_image"])]
        if p["box_image"]:
            add_imgs.append(encode_img_url(p["box_image"]))
        add_img_str = ",".join([img for img in add_imgs if img])

        # Scent notes formatted for descriptions and highlights (with standard commas)
        desc_top = ", ".join(p["topNotes"])
        desc_heart = ", ".join(p["heartNotes"])
        desc_base = ", ".join(p["baseNotes"])

        # CRITICAL FIX FOR GOOGLE MERCHANT CENTER:
        # In the 'product_detail' attribute, Google uses commas to separate multiple subattributes.
        # If an attribute value contains a comma (like "Grapefruit, Lemon"), Google splits on the comma
        # and sees "Lemon" as a separate subattribute with ZERO colons, causing:
        # "Too few subattributes for attribute: product_detail (Error 116)".
        # Therefore, inside product_detail, notes MUST use hyphens or slashes instead of commas.
        detail_top = " - ".join(p["topNotes"])
        detail_heart = " - ".join(p["heartNotes"])
        detail_base = " - ".join(p["baseNotes"])

        for size_str, sku, price, cogs, vol in [("50ml", sku_50, price_50, cogs_50, "50 ml"), ("100ml", sku_100, price_100, cogs_100, "100 ml")]:
            if not is_arabic:
                title = f"SCNT.eg {p['name']} Eau de Parfum - {size_str} ({p['inspired_from']} Impression)"
                desc = (
                    f"{p['name']} by SCNT.eg ({size_str}). {p['description']} "
                    f"Part of {p['collection']} Collection. "
                    f"Top Notes: {desc_top}. Heart Notes: {desc_heart}. Base Notes: {desc_base}. "
                    f"Artisanal Eau de Parfum crafted in Egypt."
                )
                highlights = f"Long-lasting Eau de Parfum concentration, High quality perfume oils crafted in Egypt, {p['scent_family']} scent profile, Inspired by {p['inspired_from']}"
                # Each comma-separated element has EXACTLY 2 colons (section:attribute:value) and ZERO internal commas
                details = (
                    f"Fragrance:Concentration:Eau de Parfum, "
                    f"Fragrance:Scent Family:{p['scent_family']}, "
                    f"Collection:Series:{p['collection']}, "
                    f"Olfactory:Top Notes:{detail_top}, "
                    f"Olfactory:Heart Notes:{detail_heart}, "
                    f"Olfactory:Base Notes:{detail_base}, "
                    f"Packaging:Bottle Volume:{size_str}"
                )
            else:
                title = f"عطر {p['ar_name']} أو دو بارفام من SCNT.eg - {size_str} (مستوحى من {p['ar_inspired']})"
                desc = (
                    f"عطر {p['ar_name']} من SCNT.eg بحجم {size_str}. {p['ar_description']} "
                    f"من تشكيلة {p['collection']}. "
                    f"المكونات العليا: {desc_top}. المكونات الوسطى: {desc_heart}. القاعدة: {desc_base}. "
                    f"عطر فاخر عالي الثبات مصنع في مصر."
                )
                highlights = f"تركيز عالي وثبات استثنائي أو دو بارفام, زيوت عطرية نقية وممتازة مصنعة في مصر, عائلة {p['scent_family']} العطرية, مستوحى من {p['ar_inspired']}"
                # Each comma-separated element in Arabic has EXACTLY 2 colons and ZERO internal commas
                details = (
                    f"العطر:التركيز:أو دو بارفام, "
                    f"العائلة:عائلة العطر:{p['scent_family']}, "
                    f"التشكيلة:الاسم:{p['collection']}, "
                    f"الهرم العطري:المقدمة:{detail_top}, "
                    f"الهرم العطري:القلب:{detail_heart}, "
                    f"الهرم العطري:القاعدة:{detail_base}, "
                    f"الحجم:حجم العبوة:{size_str}"
                )

            prod_url = f"{BASE_URL}/product/{p['slug']}"
            
            row = [
                sku,                                       # id
                title,                                     # title
                desc,                                      # description
                "in_stock",                                # availability
                "",                                        # availability_date
                "",                                        # expiration_date
                prod_url,                                  # link
                prod_url,                                  # mobile_link
                img_main,                                  # image_link
                price,                                     # price
                "",                                        # sale_price
                "",                                        # sale_price_effective_date
                "no",                                      # identifier_exists (niche bespoke craft brand without GS1 barcode)
                "",                                        # gtin
                sku,                                       # mpn
                "SCNT.eg",                                 # brand
                highlights,                                # product_highlight
                details,                                   # product_detail
                add_img_str,                               # additional_image_link
                "new",                                     # condition
                "no",                                      # adult
                p["color"],                                # color
                size_str,                                  # size
                "regular",                                 # size_type
                "EU",                                      # size_system
                p["gender"],                               # gender
                "Glass bottle, fine mist sprayer, fragrance oil", # material
                "Solid",                                   # pattern
                "adult",                                   # age_group
                "",                                        # multipack
                "no",                                      # is_bundle
                vol,                                       # unit_pricing_measure
                "100 ml",                                  # unit_pricing_base_measure
                "",                                        # energy_efficiency_class
                "",                                        # min_energy_efficiency_class
                "",                                        # max_energy_efficiency
                item_group_id,                             # item_group_id
                "",                                        # video_link
                "",                                        # virtual_model_link
                cogs                                       # cost_of_goods_sold
            ]
            rows.append(row)
    return rows

def build_workbook():
    wb = openpyxl.Workbook()
    
    # 1. Primary Sheet: SCNT_Product_Feed
    ws_feed = wb.active
    ws_feed.title = "SCNT_Product_Feed"

    # 2. Sheet 2: SCNT_Arabic_Feed
    ws_ar = wb.create_sheet(title="SCNT_Arabic_Feed")

    # 3. Sheet 3: Field_Specifications
    ws_dict = wb.create_sheet(title="Field_Specifications")

    # 4. Sheet 4: Allowed_Values
    ws_lookups = wb.create_sheet(title="Allowed_Values")

    ws_feed.views.sheetView[0].showGridLines = True
    ws_ar.views.sheetView[0].showGridLines = True
    ws_dict.views.sheetView[0].showGridLines = True
    ws_lookups.views.sheetView[0].showGridLines = True

    # 40 Google Merchant Center Attributes in order
    attribute_headers = [
        "id", "title", "description", "availability", "availability_date", "expiration_date",
        "link", "mobile_link", "image_link", "price", "sale_price", "sale_price_effective_date",
        "identifier_exists", "gtin", "mpn", "brand", "product_highlight", "product_detail",
        "additional_image_link", "condition", "adult", "color", "size", "size_type",
        "size_system", "gender", "material", "pattern", "age_group", "multipack",
        "is_bundle", "unit_pricing_measure", "unit_pricing_base_measure",
        "energy_efficiency_class", "min_energy_efficiency_class", "max_energy_efficiency",
        "item_group_id", "video_link", "virtual_model_link", "cost_of_goods_sold"
    ]

    # Lookups
    lookup_categories = {
        "availability_list": ("Availability Status", ["in_stock", "out_of_stock", "preorder", "backorder"]),
        "condition_list": ("Condition", ["new", "refurbished", "used"]),
        "boolean_list": ("Yes / No Flag", ["yes", "no"]),
        "gender_list": ("Gender", ["female", "male", "unisex"]),
        "age_group_list": ("Age Group", ["newborn", "infant", "toddler", "children", "adult"]),
        "size_type_list": ("Size Type", ["regular", "petite", "plus", "tall", "big", "maternity"]),
        "size_system_list": ("Size System", ["US", "UK", "EU", "DE", "FR", "JP", "CN", "IT", "BR", "MEX", "AU"]),
        "energy_list": ("Energy Efficiency Class", ["A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"]),
        "currency_list": ("Currency (ISO 4217)", ["EGP", "USD", "EUR", "SAR", "AED", "GBP", "KWD"]),
        "measure_units": ("Pricing Units", ["ml", "l", "oz", "floz", "g", "kg", "ct"])
    }

    # Styling Palette
    navy_header_fill = PatternFill(start_color="1A73E8", end_color="1A73E8", fill_type="solid")
    scnt_gold_header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid") # Elegant Dark Charcoal
    dark_slate_fill = PatternFill(start_color="202124", end_color="202124", fill_type="solid")
    zebra_even_fill = PatternFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    highlight_accent_fill = PatternFill(start_color="E8F0FE", end_color="E8F0FE", fill_type="solid")

    font_header = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
    font_bold = Font(name="Segoe UI", size=10, bold=True, color="1F2937")
    font_regular = Font(name="Segoe UI", size=10, color="202124")
    font_link = Font(name="Segoe UI", size=10, color="1A73E8", underline="single")
    font_title = Font(name="Segoe UI", size=14, bold=True, color="1A73E8")
    font_subtitle = Font(name="Segoe UI", size=10, italic=True, color="5F6368")

    thin_border_side = Side(style="thin", color="DADCE0")
    thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

    # ---------------------------------------------------------
    # Populate ws_lookups
    # ---------------------------------------------------------
    ws_lookups.cell(row=1, column=1, value="Google Merchant Center - Reference Lookups & Allowed Values").font = font_title
    ws_lookups.row_dimensions[1].height = 28
    
    col_idx = 1
    lookup_col_mapping = {}
    for key, (heading, values) in lookup_categories.items():
        cell_head = ws_lookups.cell(row=3, column=col_idx, value=heading)
        cell_head.font = font_header
        cell_head.fill = dark_slate_fill
        cell_head.alignment = Alignment(horizontal="center", vertical="center")
        cell_head.border = thin_border
        
        for r_i, val in enumerate(values, start=4):
            c = ws_lookups.cell(row=r_i, column=col_idx, value=val)
            c.font = font_regular
            c.alignment = Alignment(horizontal="center", vertical="center")
            c.border = thin_border
            if (r_i % 2) == 1:
                c.fill = zebra_even_fill

        lookup_col_mapping[key] = (get_column_letter(col_idx), 4, 3 + len(values))
        ws_lookups.column_dimensions[get_column_letter(col_idx)].width = max(len(heading) + 4, 18)
        col_idx += 2

    # Helper function to populate and style feed sheet
    def populate_feed_sheet(ws, rows_data, is_ar=False):
        ws.row_dimensions[1].height = 28
        for c_i, h_name in enumerate(attribute_headers, start=1):
            cell = ws.cell(row=1, column=c_i, value=h_name)
            cell.font = font_header
            cell.fill = scnt_gold_header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        for r_i, row_data in enumerate(rows_data, start=2):
            ws.row_dimensions[r_i].height = 24
            fill_to_use = white_fill if (r_i % 2 == 0) else zebra_even_fill
            for c_i, val in enumerate(row_data, start=1):
                cell = ws.cell(row=r_i, column=c_i, value=val)
                cell.font = font_regular
                cell.fill = fill_to_use
                cell.border = thin_border
                
                code = attribute_headers[c_i-1]
                if code in ["id", "gtin", "mpn", "availability", "identifier_exists", "condition", "adult", "gender", "age_group", "size", "size_type", "size_system", "multipack", "is_bundle", "item_group_id"]:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                elif code in ["price", "sale_price", "cost_of_goods_sold", "unit_pricing_measure", "unit_pricing_base_measure"]:
                    cell.alignment = Alignment(horizontal="right", vertical="center")
                else:
                    if is_ar and code in ["title", "description", "product_highlight", "product_detail"]:
                        cell.alignment = Alignment(horizontal="right", vertical="center")
                    else:
                        cell.alignment = Alignment(horizontal="left", vertical="center")

        # Column widths
        for c_i, code in enumerate(attribute_headers, start=1):
            if code in ["description"]:
                w = 55
            elif code in ["title", "product_highlight", "product_detail"]:
                w = 38
            elif code in ["link", "mobile_link", "image_link", "additional_image_link", "material"]:
                w = 32
            elif code in ["id", "brand", "color", "item_group_id", "mpn"]:
                w = 20
            elif code in ["price", "sale_price", "cost_of_goods_sold", "unit_pricing_measure", "unit_pricing_base_measure"]:
                w = 18
            else:
                w = 16
            ws.column_dimensions[get_column_letter(c_i)].width = w

        # Freeze Header & ID
        ws.freeze_panes = "B2"

        # Attach Data Validations
        val_mapping = {
            "availability": "availability_list",
            "condition": "condition_list",
            "adult": "boolean_list",
            "identifier_exists": "boolean_list",
            "gender": "gender_list",
            "age_group": "age_group_list",
            "size_type": "size_type_list",
            "size_system": "size_system_list",
            "is_bundle": "boolean_list",
            "energy_efficiency_class": "energy_list",
            "min_energy_efficiency_class": "energy_list",
            "max_energy_efficiency": "energy_list",
        }
        for c_i, code in enumerate(attribute_headers, start=1):
            if code in val_mapping and val_mapping[code] in lookup_col_mapping:
                col_letter, start_r, end_r = lookup_col_mapping[val_mapping[code]]
                dv_formula = f"Allowed_Values!${col_letter}${start_r}:${col_letter}${end_r}"
                dv = DataValidation(type="list", formula1=dv_formula, allow_blank=True)
                feed_col_letter = get_column_letter(c_i)
                dv.add(f"{feed_col_letter}2:{feed_col_letter}200")
                ws.add_data_validation(dv)

    # Populate Sheet 1 (English Catalog) & Sheet 2 (Arabic Catalog)
    en_rows = generate_scnt_feed_rows(is_arabic=False)
    ar_rows = generate_scnt_feed_rows(is_arabic=True)
    
    populate_feed_sheet(ws_feed, en_rows, is_ar=False)
    populate_feed_sheet(ws_ar, ar_rows, is_ar=True)

    # ---------------------------------------------------------
    # Populate ws_dict (Field Specifications & Fragrance Tips)
    # ---------------------------------------------------------
    ws_dict.cell(row=1, column=1, value="SCNT.eg Fragrances - Google Merchant Center Specification Guide").font = font_title
    ws_dict.cell(row=2, column=1, value="Comprehensive field guidance customized for SCNT.eg luxury fragrances & cosmetics category (GMC Category: Health & Beauty > Perfume & Cologne #479).").font = font_subtitle
    ws_dict.row_dimensions[1].height = 24
    ws_dict.row_dimensions[2].height = 18

    dict_headers = [
        "Attribute Code", "Attribute Name", "SCNT Product Usage", "Requirement Status", 
        "Data Format & Example", "Official GMC Guide Link", "SCNT Fragrance Best Practices"
    ]
    ws_dict.row_dimensions[4].height = 28
    for col_i, h_name in enumerate(dict_headers, start=1):
        cell = ws_dict.cell(row=4, column=col_i, value=h_name)
        cell.font = font_header
        cell.fill = dark_slate_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    specs_data = [
        ("id", "Product SKU ID", "Unique SKU per size variant", "Required", "Alphanumeric (e.g. SCNT-AZR-100ML)", "https://support.google.com/merchants/answer/6324405", "Distinguishes 50ml and 100ml bottles cleanly in Google Ads and Shopping."),
        ("title", "Product Title", "Brand + Name + Scent Form + Size + Impression", "Required", "Max 150 chars (e.g. SCNT.eg Azure Code Eau de Parfum - 100ml)", "https://support.google.com/merchants/answer/6324415", "Includes inspired perfume note (e.g. Bleu de Chanel Impression) to capture high-intent search traffic."),
        ("description", "Product Description", "Olfactory notes & sensory story", "Required", "Max 5000 chars", "https://support.google.com/merchants/answer/6324468", "Rich description detailing top, heart, base notes, collection identity, and high-oil concentration crafted in Egypt."),
        ("availability", "Stock Availability", "Current warehouse stock", "Required", "in_stock, out_of_stock, preorder, backorder", "https://support.google.com/merchants/answer/6324448", "Set to 'in_stock' for active catalog fragrances."),
        ("availability_date", "Availability Date", "Restock date for preorders", "Required if preorder", "ISO 8601", "https://support.google.com/merchants/answer/6324470", "Only required when availability is preorder or backorder."),
        ("expiration_date", "Feed Expiration Date", "Feed item expiration", "Optional", "ISO 8601", "https://support.google.com/merchants/answer/6324499", "Google automatically expires items after 30 days if not re-fetched."),
        ("link", "Product URL", "Direct perfume landing page", "Required", "Valid URL (https://www.scnt-eg.me/product/...)", "https://support.google.com/merchants/answer/6324416", "Direct link to canonical product page on www.scnt-eg.me."),
        ("mobile_link", "Mobile Landing Page", "Mobile optimized URL", "Optional", "Valid URL", "https://support.google.com/merchants/answer/6324459", "Matches main link since SCNT.eg is fully responsive."),
        ("image_link", "Main Product Image", "Front bottle mockup", "Required", "High-res PNG / WebP URL", "https://support.google.com/merchants/answer/6324350", "Clear high-resolution front bottle mockup with clean framing."),
        ("price", "Retail Price", "Current selling price in EGP", "Required", "Number + EGP (e.g. 500.00 EGP / 750.00 EGP)", "https://support.google.com/merchants/answer/6324371", "Exact matching price on SCNT website in Egyptian Pounds."),
        ("sale_price", "Sale Price", "Promotional price in EGP", "Optional", "Number + EGP", "https://support.google.com/merchants/answer/6324471", "Populate when running seasonal promos or flash sales."),
        ("sale_price_effective_date", "Sale Effective Date", "Start & end date of sale", "Optional", "Start/End ISO 8601", "https://support.google.com/merchants/answer/6324460?hl=en&ref_topic=6324338", "Separated by slash (/)."),
        ("identifier_exists", "Identifier Exists", "Unique barcode flag", "Required", "'no' (or 'yes' if registered barcode)", "https://support.google.com/merchants/answer/6324478", "Set to 'no' for bespoke luxury perfumery without GS1 GTIN barcodes, avoiding Google Merchant disapproval."),
        ("gtin", "Global Trade Number", "UPC/EAN barcode", "Required if assigned", "8, 12, 13, 14 digits", "https://support.google.com/merchants/answer/6324461", "Leave blank if no international barcode is assigned."),
        ("mpn", "Manufacturer Part Number", "Internal SCNT SKU", "Required if no GTIN", "Max 70 alphanumeric (e.g. SCNT-AZR-100ML)", "https://support.google.com/merchants/answer/6324482", "Used by Google to identify exact manufacturer parts."),
        ("brand", "Brand Name", "Official brand name", "Required", "SCNT.eg", "https://support.google.com/merchants/answer/6324351", "Consistent official brand name 'SCNT.eg' across all listings."),
        ("product_highlight", "Product Highlights", "Bullet points in Google Shopping", "Optional but beneficial", "Comma-separated key highlights", "https://support.google.com/merchants/answer/9216100", "Highlights Eau de Parfum concentration, scent family, and inspiration."),
        ("product_detail", "Product Specifications", "Scent Pyramid & Notes Breakdown", "Optional but beneficial", "section:attribute:value", "https://support.google.com/merchants/answer/9218260", "Structured scent notes (Top, Heart, Base) displayed natively in Google search knowledge cards."),
        ("additional_image_link", "Gallery Images", "Back mockup, box, clear bottle", "Optional but beneficial", "Comma-separated URLs", "https://support.google.com/merchants/answer/6324370", "Shows rear bottle, clear transparent cutout, and luxury box packaging."),
        ("condition", "Item Condition", "Product condition", "Required", "'new'", "https://support.google.com/merchants/answer/6324469", "Always 'new' for newly crafted fragrances."),
        ("adult", "Adult Content Flag", "Explicit content flag", "Required", "'no'", "https://support.google.com/merchants/answer/6324508", "Always 'no'."),
        ("color", "Color / Scent Theme", "Visual bottle & liquid color theme", "Optional for perfumes", "Text color (e.g. Executive Navy, Ocean Deep Blue)", "https://support.google.com/merchants/answer/6324487", "Helps shoppers filter by aesthetic or liquid tone."),
        ("size", "Bottle Volume", "Perfume bottle size", "Required for cosmetics variants", "50ml, 100ml", "https://support.google.com/merchants/answer/6324492", "Enables variant dropdown on Google Shopping."),
        ("size_type", "Size Type", "Standard size cut", "Optional", "'regular'", "https://support.google.com/merchants/answer/63244972", "Set to 'regular'."),
        ("size_system", "Size System", "Standard measurement system", "Optional", "'EU' or 'US'", "https://support.google.com/merchants/answer/6324502", "Set to 'EU' for milliliter cosmetics standards."),
        ("gender", "Target Gender", "Fragrance gender recommendation", "Recommended", "'male', 'female', 'unisex'", "https://support.google.com/merchants/answer/6324479", "Crucial for perfume shopping filters: male (Azure, Deep, Cobalt, etc.) and female (Golden Bloom, Lumiere)."),
        ("material", "Materials & Ingredients", "Packaging & formulation materials", "Optional", "Text", "https://support.google.com/merchants/answer/6324410", "Glass bottle, metal fine mist sprayer, fragrance oils."),
        ("pattern", "Visual Pattern", "Pattern finish", "Optional", "'Solid'", "https://support.google.com/merchants/answer/6324483", "Set to 'Solid'."),
        ("age_group", "Age Group", "Target demographic", "Recommended", "'adult'", "https://support.google.com/merchants/answer/6324463", "Perfumes are targeted at 'adult' demographic."),
        ("multipack", "Multipack Quantity", "Grouped identical items", "Required if bundle", "Integer (blank for singles)", "https://support.google.com/merchants/answer/6324488", "Leave blank for single perfume bottles."),
        ("is_bundle", "Is Bundle", "Custom kit flag", "Required if bundle", "'no'", "https://support.google.com/merchants/answer/6324449", "'no' for individual perfume bottles."),
        ("unit_pricing_measure", "Unit Pricing Measure", "Bottle volume measure", "Recommended for perfumes", "50 ml, 100 ml", "https://support.google.com/merchants/answer/6324455", "Allows Google to calculate price per 100ml for easy value comparison."),
        ("unit_pricing_base_measure", "Unit Base Measure", "Comparison baseline", "Recommended for perfumes", "100 ml", "https://support.google.com/merchants/answer/6324490", "Standard 100ml base denominator for fragrance price comparison."),
        ("energy_efficiency_class", "Energy Class", "Not applicable to perfumes", "Not applicable", "Leave blank", "https://support.google.com/merchants/answer/7562785", "Cosmetics and perfumes do not carry electrical energy labels."),
        ("min_energy_efficiency_class", "Min Energy Class", "Not applicable to perfumes", "Not applicable", "Leave blank", "https://support.google.com/merchants/answer/7562785", "Leave blank."),
        ("max_energy_efficiency", "Max Energy Class", "Not applicable to perfumes", "Not applicable", "Leave blank", "https://support.google.com/merchants/answer/7562785", "Leave blank."),
        ("item_group_id", "Item Group ID", "Parent fragrance grouping ID", "Required for variants", "e.g. SCNT-AZR, SCNT-DPH", "https://support.google.com/merchants/answer/6324507", "Links the 50ml and 100ml variants together under a single Google Shopping listing!"),
        ("video_link", "Product Video Link", "Showcase video URL", "Optional", "YouTube / MP4 URL", "https://support.google.com/merchants/answer/13813861", "Brand showcase or unboxing video."),
        ("virtual_model_link", "Virtual 3D Model", "3D bottle model (.glb)", "Optional", ".glb / .gltf URL", "https://support.google.com/merchants/answer/10039537", "Interactive 3D bottle preview for AR shopping."),
        ("cost_of_goods_sold", "COGS", "Manufacturing & formulation cost", "Optional (Private)", "Value + EGP (e.g. 135.00 EGP / 195.00 EGP)", "https://support.google.com/merchants/answer/9017895", "Derived from SCNT CostConfig: bottle + box + sticker + alcohol + oil. Enables accurate ROAS and gross profit analytics in Google Ads.")
    ]

    req_fill = PatternFill(start_color="FCE8E6", end_color="FCE8E6", fill_type="solid")
    req_font = Font(name="Segoe UI", size=9, bold=True, color="C5221F")
    cond_fill = PatternFill(start_color="FEF7E0", end_color="FEF7E0", fill_type="solid")
    cond_font = Font(name="Segoe UI", size=9, bold=True, color="B06000")
    opt_fill = PatternFill(start_color="E6F4EA", end_color="E6F4EA", fill_type="solid")
    opt_font = Font(name="Segoe UI", size=9, bold=True, color="137333")

    for idx, item in enumerate(specs_data, start=5):
        ws_dict.row_dimensions[idx].height = 36
        fill_to_use = white_fill if (idx % 2 == 1) else zebra_even_fill
        
        c1 = ws_dict.cell(row=idx, column=1, value=item[0])
        c1.font = Font(name="Consolas", size=10, bold=True, color="1A73E8")
        c1.fill = fill_to_use
        c1.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        c1.border = thin_border
        
        c2 = ws_dict.cell(row=idx, column=2, value=item[1])
        c2.font = font_bold
        c2.fill = fill_to_use
        c2.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        c2.border = thin_border

        c3 = ws_dict.cell(row=idx, column=3, value=item[2])
        c3.font = font_regular
        c3.fill = fill_to_use
        c3.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        c3.border = thin_border

        c4 = ws_dict.cell(row=idx, column=4, value=item[3])
        c4.border = thin_border
        c4.alignment = Alignment(horizontal="center", vertical="center")
        if "Required" in item[3]:
            c4.fill = req_fill if item[3] == "Required" else cond_fill
            c4.font = req_font if item[3] == "Required" else cond_font
        else:
            c4.fill = opt_fill
            c4.font = opt_font

        c5 = ws_dict.cell(row=idx, column=5, value=item[4])
        c5.font = font_regular
        c5.fill = fill_to_use
        c5.alignment = Alignment(horizontal="center", vertical="center")
        c5.border = thin_border

        c6 = ws_dict.cell(row=idx, column=6, value="Google Guide ↗")
        c6.hyperlink = item[5]
        c6.font = font_link
        c6.fill = fill_to_use
        c6.alignment = Alignment(horizontal="center", vertical="center")
        c6.border = thin_border

        c7 = ws_dict.cell(row=idx, column=7, value=item[6])
        c7.font = font_regular
        c7.fill = fill_to_use
        c7.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        c7.border = thin_border

    ws_dict.column_dimensions["A"].width = 25
    ws_dict.column_dimensions["B"].width = 25
    ws_dict.column_dimensions["C"].width = 30
    ws_dict.column_dimensions["D"].width = 24
    ws_dict.column_dimensions["E"].width = 32
    ws_dict.column_dimensions["F"].width = 20
    ws_dict.column_dimensions["G"].width = 65
    ws_dict.freeze_panes = "A5"

    # Save to both target locations
    path1 = os.path.join(os.getcwd(), "SCNT_Google_Merchant_Catalog.xlsx")
    path2 = os.path.join(os.getcwd(), "google_merchant_product_feed.xlsx")
    wb.save(path1)
    wb.save(path2)
    print(f"Generated: {path1}")
    print(f"Updated: {path2}")

    # Generate ready-to-upload TSV & CSV
    tsv_path = os.path.join(os.getcwd(), "scnt_merchant_feed.tsv")
    csv_path = os.path.join(os.getcwd(), "scnt_merchant_feed.csv")
    
    with open(tsv_path, "w", encoding="utf-8") as f_tsv:
        f_tsv.write("\t".join(attribute_headers) + "\n")
        for r in en_rows:
            f_tsv.write("\t".join(r) + "\n")
            
    import csv
    with open(csv_path, "w", encoding="utf-8", newline="") as f_csv:
        writer = csv.writer(f_csv)
        writer.writerow(attribute_headers)
        for r in en_rows:
            writer.writerow(r)

    print(f"Generated TSV: {tsv_path}")
    print(f"Generated CSV: {csv_path}")

if __name__ == "__main__":
    build_workbook()
