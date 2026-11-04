import openpyxl
import csv

def validate_product_detail(file_name, sheet_name, col_idx=18):
    wb = openpyxl.load_workbook(file_name)
    ws = wb[sheet_name]
    print(f"\n--- Validating {file_name} [{sheet_name}] ---")
    error_count = 0
    total_sub_items = 0
    
    for r in range(2, ws.max_row + 1):
        sku = ws.cell(row=r, column=1).value
        detail_val = ws.cell(row=r, column=col_idx).value
        if not detail_val:
            continue
        
        # Split on comma (as Google Merchant Center parser does)
        items = [i.strip() for i in detail_val.split(",")]
        for item in items:
            total_sub_items += 1
            parts = item.split(":")
            # Must have exactly 3 parts: section:attribute:value (2 colons)
            if len(parts) != 3:
                print(f"ERROR on Row {r} (SKU {sku}): Found {len(parts)} parts instead of 3 in item: '{item}'")
                error_count += 1
            else:
                sec, attr, val = parts
                if not attr.strip() or not val.strip():
                    print(f"ERROR on Row {r} (SKU {sku}): Empty required attribute_name or attribute_value in: '{item}'")
                    error_count += 1
                    
    print(f"Result for {sheet_name}: {total_sub_items} sub-attributes checked, {error_count} errors found.")
    assert error_count == 0, f"Validation failed with {error_count} errors!"

def validate_tsv(tsv_path):
    print(f"\n--- Validating TSV: {tsv_path} ---")
    with open(tsv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        headers = next(reader)
        col_idx = headers.index("product_detail")
        error_count = 0
        total_sub_items = 0
        for r_i, row in enumerate(reader, start=2):
            sku = row[0]
            val = row[col_idx]
            items = [i.strip() for i in val.split(",")]
            for item in items:
                total_sub_items += 1
                parts = item.split(":")
                if len(parts) != 3:
                    print(f"TSV ERROR Row {r_i} ({sku}): '{item}' has {len(parts)} parts")
                    error_count += 1
        print(f"TSV Result: {total_sub_items} sub-attributes checked, {error_count} errors found.")
        assert error_count == 0

validate_product_detail("D:/SCNT.eg/Website/SCNT_Google_Merchant_Catalog.xlsx", "SCNT_Product_Feed")
validate_product_detail("D:/SCNT.eg/Website/SCNT_Google_Merchant_Catalog.xlsx", "SCNT_Arabic_Feed")
validate_tsv("D:/SCNT.eg/Website/scnt_merchant_feed.tsv")
print("\n>>> ALL FEEDS ARE 100% COMPLIANT WITH ZERO PRODUCT_DETAIL ERRORS! <<<")
