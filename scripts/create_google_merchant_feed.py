import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

def create_google_merchant_workbook():
    wb = openpyxl.Workbook()
    # Default sheet
    ws_feed = wb.active
    ws_feed.title = "google_merchant_feed"
    
    # Sheet 2: Data Dictionary & Specifications
    ws_dict = wb.create_sheet(title="Field_Specifications")
    
    # Sheet 3: Dropdown Lists & Lookups
    ws_lookups = wb.create_sheet(title="Allowed_Values")

    # Ensure grid lines are visible
    ws_feed.views.sheetView[0].showGridLines = True
    ws_dict.views.sheetView[0].showGridLines = True
    ws_lookups.views.sheetView[0].showGridLines = True

    # -------------------------------------------------------------
    # 1. ATTRIBUTES DEFINITIONS
    # -------------------------------------------------------------
    attributes = [
        {
            "code": "id",
            "name": "Product ID",
            "required": "Required",
            "category": "Basic Product Info",
            "limit": "Max 50 alphanumeric",
            "description": "Your product's unique ID. Tip: Enter a unique ID to help Google distinguish each product from the others. Use SKUs where possible.",
            "url": "https://support.google.com/merchants/answer/6324405",
            "sample_1": "A3B5",
            "sample_2": "6429416",
            "dropdown": None
        },
        {
            "code": "title",
            "name": "Product Title",
            "required": "Required",
            "category": "Basic Product Info",
            "limit": "Max 150 characters",
            "description": "Your product's title. Clearly identify what you're selling. An accurate title helps Google show your product to the right customers.",
            "url": "https://support.google.com/merchants/answer/6324415",
            "sample_1": "Toddler girl's Google brand organic cotton sweatshirt in bright blue size 18 months",
            "sample_2": "Google brand – 70\" class 7 series LED 4K UHD smart Tizen TV",
            "dropdown": None
        },
        {
            "code": "description",
            "name": "Product Description",
            "required": "Required",
            "category": "Basic Product Info",
            "limit": "Max 5000 characters",
            "description": "Your product's description. List the most important details about your product. Highlight key features, specs, and materials.",
            "url": "https://support.google.com/merchants/answer/6324468",
            "sample_1": "Keep your sweet darling warm in fun, fluttery style with this zip-up hoodie sweatshirt from Google. Crafted from a breathable fabric, this long-sleeved sweatshirt provides soft and cosy comfort to help them breeze through their busy day.",
            "sample_2": "Enhance your viewing experience with this 70-inch Google 4K UHD smart TV. The HDR technology and 4K UHD resolution render sharp details and realistic colours, while a Crystal processor delivers exceptional picture quality on the flat-panel display. This Bluetooth-enabled Google 4K UHD smart TV is voice controllable for hands-free operation and seamless wireless streaming.",
            "dropdown": None
        },
        {
            "code": "availability",
            "name": "Availability",
            "required": "Required",
            "category": "Price & Availability",
            "limit": "Predefined values",
            "description": "Stock status: 'in_stock', 'out_of_stock', 'preorder', 'backorder'.",
            "url": "https://support.google.com/merchants/answer/6324448",
            "sample_1": "in_stock",
            "sample_2": "in_stock",
            "dropdown": "availability_list"
        },
        {
            "code": "availability_date",
            "name": "Availability Date",
            "required": "Required if preorder/backorder",
            "category": "Price & Availability",
            "limit": "ISO 8601 (YYYY-MM-DDThh:mmZ)",
            "description": "The date, with time and time zone, on which a pre-ordered or backordered product becomes available for delivery.",
            "url": "https://support.google.com/merchants/answer/6324470",
            "sample_1": "",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "expiration_date",
            "name": "Expiration Date",
            "required": "Optional",
            "category": "Basic Product Info",
            "limit": "ISO 8601 (YYYY-MM-DDThh:mmZ)",
            "description": "The date, with time and time zone, on which your product should stop being shown in Google Shopping.",
            "url": "https://support.google.com/merchants/answer/6324499",
            "sample_1": "",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "link",
            "name": "Product Link",
            "required": "Required",
            "category": "Links & Images",
            "limit": "Valid URL (http/https)",
            "description": "Your product's landing page link. Must point directly to the specific product variant landing page.",
            "url": "https://support.google.com/merchants/answer/6324416",
            "sample_1": "http://www.example.com/asp/sp.asp?cat=12&id=1030",
            "sample_2": "http://www.example.com/asp/sp.asp?cat=12&id=1030",
            "dropdown": None
        },
        {
            "code": "mobile_link",
            "name": "Mobile Link",
            "required": "Optional",
            "category": "Links & Images",
            "limit": "Valid URL (http/https)",
            "description": "Your product's mobile-optimised landing page link. Use when you have a separate mobile site.",
            "url": "https://support.google.com/merchants/answer/6324459",
            "sample_1": "",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "image_link",
            "name": "Main Image Link",
            "required": "Required",
            "category": "Links & Images",
            "limit": "Valid image URL",
            "description": "The link pointing to your product's main image. Formats: JPEG (.jpg/.jpeg), WebP (.webp), PNG (.png), GIF (.gif), BMP, TIFF.",
            "url": "https://support.google.com/merchants/answer/6324350",
            "sample_1": "http://www.example.com/image1.jpg",
            "sample_2": "http://www.example.com/image2.jpg",
            "dropdown": None
        },
        {
            "code": "price",
            "name": "Price",
            "required": "Required",
            "category": "Price & Availability",
            "limit": "Number + ISO 4217 Currency",
            "description": "Your product's price. Must match the price on landing page. E.g., 8.50 USD.",
            "url": "https://support.google.com/merchants/answer/6324371",
            "sample_1": "8.50 USD",
            "sample_2": "699.99 USD",
            "dropdown": None
        },
        {
            "code": "sale_price",
            "name": "Sale Price",
            "required": "Optional",
            "category": "Price & Availability",
            "limit": "Number + ISO 4217 Currency",
            "description": "Your product's price during an active sale. Include currency code (e.g. 6.99 USD).",
            "url": "https://support.google.com/merchants/answer/6324471",
            "sample_1": "",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "sale_price_effective_date",
            "name": "Sale Price Effective Date",
            "required": "Optional",
            "category": "Price & Availability",
            "limit": "Start/End ISO 8601 separated by /",
            "description": "The date range during which sale price applies: YYYY-MM-DDThh:mm[±hhmm]/YYYY-MM-DDThh:mm[±hhmm].",
            "url": "https://support.google.com/merchants/answer/6324460?hl=en&ref_topic=6324338",
            "sample_1": "",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "identifier_exists",
            "name": "Identifier Exists",
            "required": "Required",
            "category": "Product Identifiers",
            "limit": "'yes' or 'no'",
            "description": "Indicates whether your product has unique identification numbers (GTIN/MPN/Brand). Enter 'yes' or 'no'.",
            "url": "https://support.google.com/merchants/answer/6324478",
            "sample_1": "no",
            "sample_2": "yes",
            "dropdown": "boolean_list"
        },
        {
            "code": "gtin",
            "name": "GTIN",
            "required": "Required if assigned by mfr",
            "category": "Product Identifiers",
            "limit": "8, 12, 13, or 14 digits",
            "description": "Global Trade Item Number: UPC (12 digits), EAN (13 digits), JAN (8/13 digits), ISBN (10/13 digits), ITF-14.",
            "url": "https://support.google.com/merchants/answer/6324461",
            "sample_1": "",
            "sample_2": "853764007422",
            "dropdown": None
        },
        {
            "code": "mpn",
            "name": "MPN",
            "required": "Required if no GTIN",
            "category": "Product Identifiers",
            "limit": "Max 70 alphanumeric",
            "description": "Manufacturer Part Number. Assigned by the manufacturer. If you manufacture the item, can be your SKU.",
            "url": "https://support.google.com/merchants/answer/6324482",
            "sample_1": "",
            "sample_2": "GOOG70TU7000",
            "dropdown": None
        },
        {
            "code": "brand",
            "name": "Brand",
            "required": "Required",
            "category": "Product Identifiers",
            "limit": "Max 70 characters",
            "description": "Your product's brand name. Use the recognized brand name customers expect.",
            "url": "https://support.google.com/merchants/answer/6324351",
            "sample_1": "Google",
            "sample_2": "Google",
            "dropdown": None
        },
        {
            "code": "product_highlight",
            "name": "Product Highlight",
            "required": "Optional but beneficial",
            "category": "Rich Product Content",
            "limit": "Max 150 chars per highlight, up to 10",
            "description": "Sentence fragments highlighting key features/benefits. Comma separated or repeated headers.",
            "url": "https://support.google.com/merchants/answer/9216100",
            "sample_1": "Fashionable lightweight around-town jumper, Easy-dry organic cotton fleece, Sublimated print for vibrant colours",
            "sample_2": "New display LED, Resolution 4K (2160p)",
            "dropdown": None
        },
        {
            "code": "product_detail",
            "name": "Product Detail",
            "required": "Optional but beneficial",
            "category": "Rich Product Content",
            "limit": "section:attribute:value format",
            "description": "Technical specifications formatted as 'section_name: attribute_name: attribute_value'.",
            "url": "https://support.google.com/merchants/answer/9218260",
            "sample_1": "Sustainability:material:organic",
            "sample_2": "Display type:LED:new, Display:Resolution:4K (2160p)",
            "dropdown": None
        },
        {
            "code": "additional_image_link",
            "name": "Additional Image Link",
            "required": "Optional but beneficial",
            "category": "Links & Images",
            "limit": "Comma-separated URLs (up to 10)",
            "description": "Links to additional images showing product angles, packaging, or in-use photos.",
            "url": "https://support.google.com/merchants/answer/6324370",
            "sample_1": "https://static.awesomebrand.com/1111_100-1.jpg,https://static.awesomebrand.com/1111_100-2.jpg",
            "sample_2": "https://static.awesomebrand.com/1111_100-1.jpg,https://static.awesomebrand.com/1111_100-2.jpg",
            "dropdown": None
        },
        {
            "code": "condition",
            "name": "Condition",
            "required": "Required if refurbished/used",
            "category": "Item Details",
            "limit": "'new', 'refurbished', 'used'",
            "description": "Condition of the product at time of sale. Options: 'new', 'refurbished', 'used'.",
            "url": "https://support.google.com/merchants/answer/6324469",
            "sample_1": "new",
            "sample_2": "new",
            "dropdown": "condition_list"
        },
        {
            "code": "adult",
            "name": "Adult Content",
            "required": "Required if adult content",
            "category": "Item Details",
            "limit": "'yes' or 'no'",
            "description": "Indicates if the product includes sexually suggestive or adult content. Enter 'yes' or 'no'.",
            "url": "https://support.google.com/merchants/answer/6324508",
            "sample_1": "no",
            "sample_2": "no",
            "dropdown": "boolean_list"
        },
        {
            "code": "color",
            "name": "Color",
            "required": "Required for apparel",
            "category": "Apparel & Variants",
            "limit": "Primary/Secondary/Tertiary (max 3)",
            "description": "Product color (e.g. 'Bright Blue' or 'Red/Green/Black'). Required for clothing & accessories.",
            "url": "https://support.google.com/merchants/answer/6324487",
            "sample_1": "Bright Blue",
            "sample_2": "Titan Grey",
            "dropdown": None
        },
        {
            "code": "size",
            "name": "Size",
            "required": "Required for apparel",
            "category": "Apparel & Variants",
            "limit": "Standard size representation",
            "description": "Product size (e.g. S, M, L, XL, 18M, 70\", 10.5). Required for clothing & accessories.",
            "url": "https://support.google.com/merchants/answer/6324492",
            "sample_1": "18M",
            "sample_2": "70\"",
            "dropdown": None
        },
        {
            "code": "size_type",
            "name": "Size Type",
            "required": "Optional",
            "category": "Apparel & Variants",
            "limit": "Predefined values",
            "description": "Cut/fit: 'regular', 'petite', 'plus', 'tall', 'big', 'maternity'.",
            "url": "https://support.google.com/merchants/answer/63244972",
            "sample_1": "",
            "sample_2": "",
            "dropdown": "size_type_list"
        },
        {
            "code": "size_system",
            "name": "Size System",
            "required": "Optional",
            "category": "Apparel & Variants",
            "limit": "Country code",
            "description": "Size system country: 'US', 'UK', 'EU', 'DE', 'FR', 'JP', 'CN', 'IT', 'BR', 'MEX', 'AU'.",
            "url": "https://support.google.com/merchants/answer/6324502",
            "sample_1": "",
            "sample_2": "",
            "dropdown": "size_system_list"
        },
        {
            "code": "gender",
            "name": "Gender",
            "required": "Required for apparel",
            "category": "Apparel & Variants",
            "limit": "'female', 'male', 'unisex'",
            "description": "Target gender: 'female', 'male', 'unisex'. Required for all clothing items.",
            "url": "https://support.google.com/merchants/answer/6324479",
            "sample_1": "female",
            "sample_2": "",
            "dropdown": "gender_list"
        },
        {
            "code": "material",
            "name": "Material",
            "required": "Required for apparel/variants",
            "category": "Apparel & Variants",
            "limit": "Max 200 characters",
            "description": "Main fabric or material of product (e.g. '60% cotton 40% recycled polyester').",
            "url": "https://support.google.com/merchants/answer/6324410",
            "sample_1": "60% cotton 40% recycled polyester",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "pattern",
            "name": "Pattern",
            "required": "Required for apparel/variants",
            "category": "Apparel & Variants",
            "limit": "Max 200 characters",
            "description": "Graphic pattern or print (e.g. 'Butterflies', 'Striped', 'Polka Dot').",
            "url": "https://support.google.com/merchants/answer/6324483",
            "sample_1": "Butterflies",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "age_group",
            "name": "Age Group",
            "required": "Required for apparel/toys",
            "category": "Apparel & Variants",
            "limit": "Predefined values",
            "description": "Target demographic: 'newborn', 'infant', 'toddler', 'children', 'adult'.",
            "url": "https://support.google.com/merchants/answer/6324463",
            "sample_1": "toddler",
            "sample_2": "",
            "dropdown": "age_group_list"
        },
        {
            "code": "multipack",
            "name": "Multipack",
            "required": "Required if multipack",
            "category": "Item Grouping",
            "limit": "Integer > 1",
            "description": "Number of identical manufacturer products grouped together by merchant (e.g. 3).",
            "url": "https://support.google.com/merchants/answer/6324488",
            "sample_1": "",
            "sample_2": "3",
            "dropdown": None
        },
        {
            "code": "is_bundle",
            "name": "Is Bundle",
            "required": "Required if custom bundle",
            "category": "Item Grouping",
            "limit": "'yes' or 'no'",
            "description": "Indicates custom group of different products sold together with one main product.",
            "url": "https://support.google.com/merchants/answer/6324449",
            "sample_1": "",
            "sample_2": "",
            "dropdown": "boolean_list"
        },
        {
            "code": "unit_pricing_measure",
            "name": "Unit Pricing Measure",
            "required": "Required for unit pricing",
            "category": "Pricing Measure",
            "limit": "Number + unit (e.g. 750 ml, 1.5 kg)",
            "description": "Measure and dimension of product as sold (units: oz, lb, g, kg, floz, ml, l, ct, etc.).",
            "url": "https://support.google.com/merchants/answer/6324455",
            "sample_1": "",
            "sample_2": "1.5 kg",
            "dropdown": None
        },
        {
            "code": "unit_pricing_base_measure",
            "name": "Unit Pricing Base Measure",
            "required": "Required for unit pricing",
            "category": "Pricing Measure",
            "limit": "Number + unit (e.g. 100 ml, 100 g)",
            "description": "Base unit denominator for price comparison (e.g. 100 g, 100 ml, 1 kg).",
            "url": "https://support.google.com/merchants/answer/6324490",
            "sample_1": "",
            "sample_2": "100 g",
            "dropdown": None
        },
        {
            "code": "energy_efficiency_class",
            "name": "Energy Efficiency Class",
            "required": "Required for EU/UK energy labels",
            "category": "Energy Efficiency",
            "limit": "A+++ to G",
            "description": "Product energy efficiency rating: A+++, A++, A+, A, B, C, D, E, F, G.",
            "url": "https://support.google.com/merchants/answer/7562785",
            "sample_1": "",
            "sample_2": "",
            "dropdown": "energy_list"
        },
        {
            "code": "min_energy_efficiency_class",
            "name": "Min Energy Efficiency Class",
            "required": "Required for EU/UK energy labels",
            "category": "Energy Efficiency",
            "limit": "A+++ to G",
            "description": "Lowest possible energy class on the energy label range.",
            "url": "https://support.google.com/merchants/answer/7562785",
            "sample_1": "",
            "sample_2": "",
            "dropdown": "energy_list"
        },
        {
            "code": "max_energy_efficiency_class",
            "name": "Max Energy Efficiency Class",
            "required": "Required for EU/UK energy labels",
            "category": "Energy Efficiency",
            "limit": "A+++ to G",
            "description": "Highest possible energy class on the energy label range.",
            "url": "https://support.google.com/merchants/answer/7562785",
            "sample_1": "",
            "sample_2": "",
            "dropdown": "energy_list"
        },
        {
            "code": "item_group_id",
            "name": "Item Group ID",
            "required": "Required for product variants",
            "category": "Item Grouping",
            "limit": "Max 50 alphanumeric",
            "description": "Shared ID for parent product grouping all variants (colors, sizes) together.",
            "url": "https://support.google.com/merchants/answer/6324507",
            "sample_1": "",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "video_link",
            "name": "Video Link",
            "required": "Optional",
            "category": "Rich Product Content",
            "limit": "Valid URL (YouTube or mp4)",
            "description": "URL of an informative product showcase video showing the product in use.",
            "url": "https://support.google.com/merchants/answer/13813861",
            "sample_1": "https://www.example.com/videos/promo.mp4",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "virtual_model_link",
            "name": "Virtual 3D Model Link",
            "required": "Optional",
            "category": "Rich Product Content",
            "limit": "Valid URL (.glb or .gltf)",
            "description": "URL of an interactive 3D model file (.glb or .gltf) for Google AR shopping experience.",
            "url": "https://support.google.com/merchants/answer/10039537",
            "sample_1": "https://www.example.com/models/product.glb",
            "sample_2": "",
            "dropdown": None
        },
        {
            "code": "cost_of_goods_sold",
            "name": "Cost of Goods Sold (COGS)",
            "required": "Optional",
            "category": "Price & Availability",
            "limit": "Number + ISO 4217 Currency",
            "description": "Merchant cost for acquiring or manufacturing the item. Used for gross profit reporting in Google Ads.",
            "url": "https://support.google.com/merchants/answer/9017895",
            "sample_1": "5.00 USD",
            "sample_2": "450.00 USD",
            "dropdown": None
        }
    ]

    # -------------------------------------------------------------
    # 2. POPULATE ALLOWED VALUES (LOOKUPS SHEET)
    # -------------------------------------------------------------
    lookup_categories = {
        "availability_list": ("Availability Status", ["in_stock", "out_of_stock", "preorder", "backorder"]),
        "condition_list": ("Condition", ["new", "refurbished", "used"]),
        "boolean_list": ("Yes / No Flag", ["yes", "no"]),
        "gender_list": ("Gender", ["female", "male", "unisex"]),
        "age_group_list": ("Age Group", ["newborn", "infant", "toddler", "children", "adult"]),
        "size_type_list": ("Size Type", ["regular", "petite", "plus", "tall", "big", "maternity"]),
        "size_system_list": ("Size System", ["US", "UK", "EU", "DE", "FR", "JP", "CN", "IT", "BR", "MEX", "AU"]),
        "energy_list": ("Energy Efficiency Class", ["A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"]),
        "currency_list": ("Common Currencies (ISO 4217)", ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "EGP", "SAR", "AED"]),
        "measure_units": ("Pricing Units", ["oz", "lb", "mg", "g", "kg", "floz", "pt", "qt", "gal", "ml", "cl", "l", "cbm", "in", "ft", "yd", "cm", "m", "sqft", "sqm", "ct"])
    }

    # Styles
    navy_header_fill = PatternFill(start_color="1A73E8", end_color="1A73E8", fill_type="solid") # Google Blue
    dark_slate_fill = PatternFill(start_color="202124", end_color="202124", fill_type="solid")
    steel_header_fill = PatternFill(start_color="4285F4", end_color="4285F4", fill_type="solid")
    light_blue_fill = PatternFill(start_color="E8F0FE", end_color="E8F0FE", fill_type="solid")
    zebra_even_fill = PatternFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    
    font_header = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
    font_bold = Font(name="Segoe UI", size=10, bold=True, color="202124")
    font_regular = Font(name="Segoe UI", size=10, color="202124")
    font_link = Font(name="Segoe UI", size=10, color="1A73E8", underline="single")
    font_title = Font(name="Segoe UI", size=14, bold=True, color="1A73E8")
    font_subtitle = Font(name="Segoe UI", size=10, italic=True, color="5F6368")

    thin_border_side = Side(style="thin", color="DADCE0")
    thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

    # Populate ws_lookups
    col_idx = 1
    lookup_col_mapping = {}
    
    # Title row in ws_lookups
    ws_lookups.cell(row=1, column=1, value="Google Merchant Center - Reference Lookups & Allowed Values").font = font_title
    ws_lookups.row_dimensions[1].height = 28
    
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

    # -------------------------------------------------------------
    # 3. POPULATE GOOGLE MERCHANT FEED (SHEET 1)
    # -------------------------------------------------------------
    # Row 1 MUST BE EXACT GMC ATTRIBUTE HEADERS for automated feed ingestion
    ws_feed.row_dimensions[1].height = 28
    for col_i, attr in enumerate(attributes, start=1):
        cell = ws_feed.cell(row=1, column=col_i, value=attr["code"])
        cell.font = font_header
        cell.fill = navy_header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border

    # Sample rows (Row 2 & Row 3)
    sample_rows = [
        [attr["sample_1"] for attr in attributes],
        [attr["sample_2"] for attr in attributes]
    ]

    for row_idx, s_data in enumerate(sample_rows, start=2):
        ws_feed.row_dimensions[row_idx].height = 24
        fill_to_use = white_fill if row_idx == 2 else zebra_even_fill
        for col_idx, val in enumerate(s_data, start=1):
            cell = ws_feed.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_regular
            cell.fill = fill_to_use
            cell.border = thin_border
            
            # Formatting alignment
            code = attributes[col_idx-1]["code"]
            if code in ["id", "gtin", "mpn", "availability", "identifier_exists", "condition", "adult", "gender", "age_group", "size", "size_type", "size_system", "multipack", "is_bundle", "energy_efficiency_class", "min_energy_efficiency_class", "max_energy_efficiency_class"]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif code in ["price", "sale_price", "cost_of_goods_sold", "unit_pricing_measure", "unit_pricing_base_measure"]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    # Add 10 blank pre-formatted template rows (Row 4 to 13)
    for row_idx in range(4, 15):
        ws_feed.row_dimensions[row_idx].height = 22
        fill_to_use = white_fill if (row_idx % 2 == 0) else zebra_even_fill
        for col_idx in range(1, len(attributes) + 1):
            cell = ws_feed.cell(row=row_idx, column=col_idx)
            cell.font = font_regular
            cell.fill = fill_to_use
            cell.border = thin_border
            code = attributes[col_idx-1]["code"]
            if code in ["id", "gtin", "mpn", "availability", "identifier_exists", "condition", "adult", "gender", "age_group", "size", "size_type", "size_system", "multipack", "is_bundle", "energy_efficiency_class", "min_energy_efficiency_class", "max_energy_efficiency_class"]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif code in ["price", "sale_price", "cost_of_goods_sold", "unit_pricing_measure", "unit_pricing_base_measure"]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    # Add Data Validations for Dropdowns on ws_feed
    for col_idx, attr in enumerate(attributes, start=1):
        if attr["dropdown"] and attr["dropdown"] in lookup_col_mapping:
            col_letter, start_r, end_r = lookup_col_mapping[attr["dropdown"]]
            dv_formula = f"Allowed_Values!${col_letter}${start_r}:${col_letter}${end_r}"
            dv = DataValidation(type="list", formula1=dv_formula, allow_blank=True)
            dv.error = "Your entry is not in the list of valid Google Merchant values."
            dv.errorTitle = "Invalid Attribute Value"
            dv.prompt = f"Select a valid {attr['name']} from the dropdown."
            dv.promptTitle = f"Valid {attr['name']}"
            
            feed_col_letter = get_column_letter(col_idx)
            dv.add(f"{feed_col_letter}2:{feed_col_letter}500")
            ws_feed.add_data_validation(dv)

    # Freeze panes on ws_feed: Freeze row 1 and column 1 (Product ID)
    ws_feed.freeze_panes = "B2"

    # Set column widths for ws_feed
    for col_idx, attr in enumerate(attributes, start=1):
        code = attr["code"]
        if code in ["description"]:
            width = 45
        elif code in ["title", "product_highlight", "product_detail"]:
            width = 35
        elif code in ["link", "mobile_link", "image_link", "additional_image_link", "video_link", "virtual_model_link"]:
            width = 32
        elif code in ["id", "brand", "material", "pattern"]:
            width = 20
        elif code in ["price", "sale_price", "cost_of_goods_sold", "sale_price_effective_date", "availability_date", "expiration_date"]:
            width = 18
        else:
            width = 16
        ws_feed.column_dimensions[get_column_letter(col_idx)].width = width

    # -------------------------------------------------------------
    # 4. POPULATE SPECIFICATIONS & DATA DICTIONARY (SHEET 2)
    # -------------------------------------------------------------
    # Title Block
    ws_dict.cell(row=1, column=1, value="Google Merchant Center - Product Feed Specification Guide").font = font_title
    ws_dict.cell(row=2, column=1, value="Complete reference of feed attributes, formatting rules, character limits, requirements, and official documentation links.").font = font_subtitle
    ws_dict.row_dimensions[1].height = 24
    ws_dict.row_dimensions[2].height = 18

    dict_headers = [
        "Attribute Code (Header)", 
        "Display Name", 
        "Category", 
        "Requirement Status", 
        "Format / Character Limit", 
        "Official Documentation Link", 
        "Detailed Specification & Best Practice Tip"
    ]

    ws_dict.row_dimensions[4].height = 28
    for col_i, h_name in enumerate(dict_headers, start=1):
        cell = ws_dict.cell(row=4, column=col_i, value=h_name)
        cell.font = font_header
        cell.fill = dark_slate_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    # Status styling badges
    req_fill = PatternFill(start_color="FCE8E6", end_color="FCE8E6", fill_type="solid") # Soft red/pink
    req_font = Font(name="Segoe UI", size=9, bold=True, color="C5221F")
    
    cond_fill = PatternFill(start_color="FEF7E0", end_color="FEF7E0", fill_type="solid") # Soft yellow/orange
    cond_font = Font(name="Segoe UI", size=9, bold=True, color="B06000")
    
    opt_fill = PatternFill(start_color="E6F4EA", end_color="E6F4EA", fill_type="solid") # Soft green
    opt_font = Font(name="Segoe UI", size=9, bold=True, color="137333")

    for idx, attr in enumerate(attributes, start=5):
        ws_dict.row_dimensions[idx].height = 36
        fill_to_use = white_fill if (idx % 2 == 1) else zebra_even_fill
        
        # Col 1: Code
        c1 = ws_dict.cell(row=idx, column=1, value=attr["code"])
        c1.font = Font(name="Consolas", size=10, bold=True, color="1A73E8")
        c1.fill = fill_to_use
        c1.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        c1.border = thin_border
        
        # Col 2: Name
        c2 = ws_dict.cell(row=idx, column=2, value=attr["name"])
        c2.font = font_bold
        c2.fill = fill_to_use
        c2.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        c2.border = thin_border

        # Col 3: Category
        c3 = ws_dict.cell(row=idx, column=3, value=attr["category"])
        c3.font = font_regular
        c3.fill = fill_to_use
        c3.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        c3.border = thin_border

        # Col 4: Requirement
        c4 = ws_dict.cell(row=idx, column=4, value=attr["required"])
        c4.border = thin_border
        c4.alignment = Alignment(horizontal="center", vertical="center")
        if "Required if" in attr["required"]:
            c4.fill = cond_fill
            c4.font = cond_font
        elif attr["required"] == "Required":
            c4.fill = req_fill
            c4.font = req_font
        else:
            c4.fill = opt_fill
            c4.font = opt_font

        # Col 5: Limit
        c5 = ws_dict.cell(row=idx, column=5, value=attr["limit"])
        c5.font = font_regular
        c5.fill = fill_to_use
        c5.alignment = Alignment(horizontal="center", vertical="center")
        c5.border = thin_border

        # Col 6: Support Link
        c6 = ws_dict.cell(row=idx, column=6, value="Google Support Article ↗")
        c6.hyperlink = attr["url"]
        c6.font = font_link
        c6.fill = fill_to_use
        c6.alignment = Alignment(horizontal="center", vertical="center")
        c6.border = thin_border

        # Col 7: Description / Tips
        c7 = ws_dict.cell(row=idx, column=7, value=attr["description"])
        c7.font = font_regular
        c7.fill = fill_to_use
        c7.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        c7.border = thin_border

    # Set column widths for ws_dict
    ws_dict.column_dimensions["A"].width = 28
    ws_dict.column_dimensions["B"].width = 25
    ws_dict.column_dimensions["C"].width = 20
    ws_dict.column_dimensions["D"].width = 24
    ws_dict.column_dimensions["E"].width = 28
    ws_dict.column_dimensions["F"].width = 26
    ws_dict.column_dimensions["G"].width = 65

    ws_dict.freeze_panes = "A5"

    # Save workbook
    output_path = os.path.join(os.getcwd(), "google_merchant_product_feed.xlsx")
    wb.save(output_path)
    print(f"Excel workbook successfully created at: {output_path}")

    # Also create a clean TSV and CSV file for direct upload into Google Merchant Center
    tsv_path = os.path.join(os.getcwd(), "google_merchant_feed.tsv")
    csv_path = os.path.join(os.getcwd(), "google_merchant_feed.csv")
    
    headers = [a["code"] for a in attributes]
    row1 = [a["sample_1"] for a in attributes]
    row2 = [a["sample_2"] for a in attributes]

    with open(tsv_path, "w", encoding="utf-8") as f_tsv:
        f_tsv.write("\t".join(headers) + "\n")
        f_tsv.write("\t".join(row1) + "\n")
        f_tsv.write("\t".join(row2) + "\n")
    print(f"TSV feed successfully created at: {tsv_path}")

    import csv
    with open(csv_path, "w", encoding="utf-8", newline="") as f_csv:
        writer = csv.writer(f_csv)
        writer.writerow(headers)
        writer.writerow(row1)
        writer.writerow(row2)
    print(f"CSV feed successfully created at: {csv_path}")

if __name__ == "__main__":
    create_google_merchant_workbook()
