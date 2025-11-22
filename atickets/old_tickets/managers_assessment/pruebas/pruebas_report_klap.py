from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

# 1. Create a PDF canvas
c = canvas.Canvas("report.pdf", pagesize=A4)

# 2. Draw text
c.setFont("Helvetica", 14)
c.drawString(50, 800, "📊 Quarterly Report")

# 3. Add image (like a graph you saved)
c.drawImage("/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/pruebas/results/fifa_radar_chart.png", 50, 600)

# 4. Add table
data = [
    ["Metric", "Q1", "Q2"],
    ["Revenue", "$100K", "$120K"],
    ["Growth", "10%", "20%"]
]

table = Table(data, colWidths=[100, 100, 100])
table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.grey),
    ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),
    ('ALIGN',(0,0),(-1,-1),'CENTER'),
    ('GRID', (0,0), (-1,-1), 1, colors.black),
]))

table.wrapOn(c, 50, 400)
table.drawOn(c, 50, 400)

# 5. Save the PDF
c.save()