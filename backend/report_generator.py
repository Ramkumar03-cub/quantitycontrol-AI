from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
import time

def generate_pdf_report(stats, recent_history):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    heading_style = styles['Heading2']
    normal_style = styles['Normal']
    
    # 1. Header
    elements.append(Paragraph("QC AI - Inspection Report", title_style))
    elements.append(Paragraph(f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    elements.append(Spacer(1, 20))
    
    # 2. KPI Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    elements.append(Spacer(1, 10))
    
    kpi_data = [
        ["Metric", "Value"],
        ["Total Inspections", str(stats['kpi']['total_inspections'])],
        ["Pass Rate", f"{stats['kpi']['pass_rate']}%"],
        ["Total Failures", str(stats['kpi']['fail_count'])]
    ]
    
    kpi_table = Table(kpi_data, colWidths=[200, 100])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 20))
    
    # 3. Recent Inspections
    elements.append(Paragraph("Recent Inspections (Last 20)", heading_style))
    elements.append(Spacer(1, 10))
    
    history_data = [["ID", "Time", "Status", "Defects"]]
    
    for record in recent_history[:20]:
        # Format timestamp
        ts = time.strftime('%H:%M:%S', time.localtime(record['timestamp']))
        
        # Format defects
        defects_str = "-"
        if record['vision_defects']:
            import json
            try:
                defects = json.loads(record['vision_defects'])
                names = [d.get('label', 'Unknown') for d in defects]
                defects_str = ", ".join(names)
            except:
                pass
                
        history_data.append([
            str(record['id']),
            ts,
            record['status'],
            defects_str
        ])
        
    history_table = Table(history_data, colWidths=[40, 80, 60, 250])
    history_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    # Color code status rows
    for i, row in enumerate(history_data[1:], start=1):
        if row[2] == 'FAIL':
            history_table.setStyle(TableStyle([
                ('TEXTCOLOR', (2, i), (2, i), colors.red),
            ]))
        else:
            history_table.setStyle(TableStyle([
                ('TEXTCOLOR', (2, i), (2, i), colors.green),
            ]))
            
    elements.append(history_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
