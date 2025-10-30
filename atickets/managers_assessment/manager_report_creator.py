from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
import pandas as pd

from utils.clients.aws_client import query_athena
from utils.data_loader.loader import Loader
from utils.dbt.dbt_runner import DBTRunner
from utils.query_runner.query_runner import QueryRunner




class Manager:
    email: str
    data: pd.DataFrame
    stats: dict

    def __init__(self, email):
        self.email = email
        self._load_data()
        # self.build_stats()

    def do_everything(self):
        self.build_stats()
        self.get_results_directory()
        self.build_graphics()
        self.store_stats()
        self.build_report()  # PDF report
        self.build_html_report()  # HTML report

    def build_report(self):
        """
        Generate a comprehensive PDF report for the manager's assessment.
        """
        results_dir = self.get_results_directory()
        report_path = f"{results_dir}/manager_assessment_report.pdf"
        
        # Create PDF canvas
        c = canvas.Canvas(report_path, pagesize=A4)
        width, height = A4
        
        # Set initial position
        y_position = height - 30
        
        # Title - smaller
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_position, f"📊 Manager Assessment Report - {self.email}")
        y_position -= 25
        
        # Summary table
        summary_data = [
            ["Metric", "Value"],
            ["Total Responses", str(self.stats.get('total_responses', 0))],
        ]
        
        for eval_type, data in self.stats.get('by_evaluation_type', {}).items():
            display_name = eval_type.replace('_', ' ').title().replace('Data', '')
            responses = data.get('total_responses', 0)
            summary_data.append([f"{display_name} Responses", str(responses)])
        
        summary_table = Table(summary_data, colWidths=[120, 80], rowHeights=[12] * len(summary_data))
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ]))
        
        table_height = len(summary_data) * 12 + 5
        summary_table.wrapOn(c, 50, y_position - table_height)
        summary_table.drawOn(c, 50, y_position - table_height)
        y_position -= table_height + 15
        
        # Detailed scores table
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y_position, "� Detailed Assessment Scores")
        y_position -= 15
        
        # Create detailed scores table
        fields = list(self.stats.get('by_evaluation_type', {}).get('self_data', {}).get('averages', {}).keys())
        scores_data = [["Competency", "Self", "Manager", "Direct Report", "Avg"]]
        
        for field in fields:
            field_display = field.replace('_', ' ').title()[:25]
            self_score = self.stats['by_evaluation_type']['self_data']['averages'].get(field)
            manager_score = self.stats['by_evaluation_type']['manager_data']['averages'].get(field)
            dr_score = self.stats['by_evaluation_type']['direct_reports_data']['averages'].get(field)
            
            # Calculate average
            valid_scores = [s for s in [self_score, manager_score, dr_score] if s is not None]
            avg_score = f"{sum(valid_scores)/len(valid_scores):.1f}" if valid_scores else "N/A"
            
            scores_data.append([
                field_display,
                f"{self_score:.1f}" if self_score is not None else "N/A",
                f"{manager_score:.1f}" if manager_score is not None else "N/A", 
                f"{dr_score:.1f}" if dr_score is not None else "N/A",
                avg_score
            ])
        
        scores_table = Table(scores_data, colWidths=[100, 40, 40, 45, 40], rowHeights=[10] * len(scores_data))
        scores_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 1),
            ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ]))
        
        table_height = len(scores_data) * 10 + 5
        if y_position - table_height < 100:
            c.showPage()
            y_position = height - 30
        
        scores_table.wrapOn(c, 50, y_position - table_height)
        scores_table.drawOn(c, 50, y_position - table_height)
        y_position -= table_height + 15
        
        # Heatmap table
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y_position, "🔥 Assessment Heatmap")
        y_position -= 15
        
        # Create heatmap data - rows are evaluation types, columns are competencies
        short_fields = [field.replace('_', ' ').title()[:12] for field in fields[:10]]  # Limit to first 10 for space
        heatmap_data = [["Evaluator"] + short_fields]
        
        eval_types = [
            ("Direct Report", "direct_reports_data"),
            ("Self", "self_data"), 
            ("Manager", "manager_data")
        ]
        
        def get_heatmap_color(score):
            """Return color based on score value for heatmap"""
            if score is None or score == "N/A":
                return colors.lightgrey
            elif score >= 4.5:
                return colors.darkgreen
            elif score >= 4.0:
                return colors.green
            elif score >= 3.5:
                return colors.yellow
            elif score >= 3.0:
                return colors.orange
            else:
                return colors.red
        
        heatmap_row_data = []
        for display_name, eval_key in eval_types:
            row = [display_name]
            for field in fields[:10]:  # Limit to first 10 competencies
                score = self.stats['by_evaluation_type'][eval_key]['averages'].get(field)
                if score is not None:
                    row.append(f"{score:.1f}")
                    heatmap_row_data.append((len(heatmap_data), len(row)-1, score))
                else:
                    row.append("N/A")
                    heatmap_row_data.append((len(heatmap_data), len(row)-1, None))
            heatmap_data.append(row)
        
        # Create heatmap table with very compact layout
        col_widths = [60] + [25] * len(short_fields)
        heatmap_table = Table(heatmap_data, colWidths=col_widths, rowHeights=[10] * len(heatmap_data))
        
        # Build style list for heatmap colors
        heatmap_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.black),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 1),
            ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ]
        
        # Add color backgrounds for each cell based on score
        for row_idx, col_idx, score in heatmap_row_data:
            color = get_heatmap_color(score)
            heatmap_style.append(('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), color))
            # White text on dark colors, black on light colors
            if color in [colors.darkgreen, colors.green, colors.red]:
                heatmap_style.append(('TEXTCOLOR', (col_idx, row_idx), (col_idx, row_idx), colors.whitesmoke))
            else:
                heatmap_style.append(('TEXTCOLOR', (col_idx, row_idx), (col_idx, row_idx), colors.black))
        
        heatmap_table.setStyle(TableStyle(heatmap_style))
        
        table_height = len(heatmap_data) * 10 + 5
        if y_position - table_height < 100:
            c.showPage()
            y_position = height - 30
        
        heatmap_table.wrapOn(c, 50, y_position - table_height)
        heatmap_table.drawOn(c, 50, y_position - table_height)
        y_position -= table_height + 15
        
        # Perception differences table
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y_position, "🔄 Perception Gaps")
        y_position -= 15
        
        diff_data = [["Competency", "Self vs DR", "Self vs Mgr", "Status"]]
        
        for field in fields:
            field_display = field.replace('_', ' ').title()[:25]
            
            # Get differences
            dr_diff = self.stats['differences'][field].get('direct_report_self_difference')
            mgr_diff = self.stats['differences'][field].get('self_manager_difference')
            
            # Determine status
            status = "✓"
            if dr_diff is not None and abs(dr_diff) > 0.5:
                status = "⚠️"
            if mgr_diff is not None and abs(mgr_diff) > 0.5:
                status = "⚠️"
            
            diff_data.append([
                field_display,
                f"{dr_diff:+.1f}" if dr_diff is not None else "N/A",
                f"{mgr_diff:+.1f}" if mgr_diff is not None else "N/A",
                status
            ])
        
        diff_table = Table(diff_data, colWidths=[100, 50, 50, 25], rowHeights=[10] * len(diff_data))
        diff_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkorange),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 1),
            ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ]))
        
        table_height = len(diff_data) * 10 + 5
        if y_position - table_height < 100:
            c.showPage()
            y_position = height - 30
        
        diff_table.wrapOn(c, 50, y_position - table_height)
        diff_table.drawOn(c, 50, y_position - table_height)
        y_position -= table_height + 15
        
        # Top/Bottom performers table
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y_position, "🎯 Strengths & Growth Areas")
        y_position -= 15
        
        # Find top 5 and bottom 5 across all evaluations
        all_averages = {}
        for field in fields:
            scores = []
            for eval_type in ['self_data', 'manager_data', 'direct_reports_data']:
                score = self.stats['by_evaluation_type'][eval_type]['averages'].get(field)
                if score is not None:
                    scores.append(score)
            if scores:
                all_averages[field] = sum(scores) / len(scores)
        
        sorted_scores = sorted(all_averages.items(), key=lambda x: x[1], reverse=True)
        top_5 = sorted_scores[:5]
        bottom_5 = sorted_scores[-5:]
        
        strengths_data = [["Top Strengths", "Score", "Growth Areas", "Score"]]
        for i in range(5):
            top_name = top_5[i][0].replace('_', ' ').title()[:20] if i < len(top_5) else ""
            top_score = f"{top_5[i][1]:.1f}" if i < len(top_5) else ""
            bottom_name = bottom_5[i][0].replace('_', ' ').title()[:20] if i < len(bottom_5) else ""
            bottom_score = f"{bottom_5[i][1]:.1f}" if i < len(bottom_5) else ""
            
            strengths_data.append([top_name, top_score, bottom_name, bottom_score])
        
        strengths_table = Table(strengths_data, colWidths=[100, 35, 100, 35], rowHeights=[10] * len(strengths_data))
        strengths_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.purple),
            ('BACKGROUND', (0, 1), (1, -1), colors.lightgreen),
            ('BACKGROUND', (2, 1), (-1, -1), colors.lightcoral),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 1),
            ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ]))
        
        table_height = len(strengths_data) * 10 + 5
        if y_position - table_height < 50:
            c.showPage()
            y_position = height - 30
        
        strengths_table.wrapOn(c, 50, y_position - table_height)
        strengths_table.drawOn(c, 50, y_position - table_height)
        y_position -= table_height + 10
        
        # Add radar chart at the bottom/next page
        radar_chart_path = f"{results_dir}/assessment_radar_chart.png"
        try:
            if y_position < 200:
                c.showPage()
                y_position = height - 30
            
            c.setFont("Helvetica-Bold", 10)
            c.drawString(50, y_position, "📊 Visual Overview")
            y_position -= 15
            c.drawImage(radar_chart_path, 50, y_position - 180, width=200, height=180)
            
        except Exception as e:
            c.setFont("Helvetica", 6)
            c.drawString(50, y_position, f"Chart unavailable: {str(e)}")
        
        # Footer - much smaller
        c.setFont("Helvetica", 6)
        c.drawString(50, 15, f"Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
        c.drawString(width - 120, 15, "Manager Assessment")
        
        # Save the PDF
        c.save()
        
        print(f"📄 Manager assessment report generated: {report_path}")
        return report_path
    
    def build_html_report(self):
        """
        Generate a comprehensive HTML report for the manager's assessment.
        """
        results_dir = self.get_results_directory()
        report_path = f"{results_dir}/manager_assessment_report.html"
        
        # Get data for the report
        fields = list(self.stats.get('by_evaluation_type', {}).get('self_data', {}).get('averages', {}).keys())
        
        # Create HTML content
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manager Assessment Report</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
            font-size: 12px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .header p {{
            margin: 5px 0 0 0;
            opacity: 0.9;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .section {{
            background: white;
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .section-header {{
            background: #34495e;
            color: white;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
        }}
        .section-content {{
            padding: 15px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 11px;
        }}
        th, td {{
            padding: 6px 8px;
            text-align: center;
            border: 1px solid #ddd;
            line-height: 1.2;
        }}
        th {{
            background: #2c3e50;
            color: white;
            font-weight: bold;
            font-size: 10px;
        }}
        tr:nth-child(even) {{
            background-color: #f8f9fa;
        }}
        .heatmap-cell {{
            font-weight: bold;
            color: white;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }}
        .score-excellent {{ background-color: #27ae60 !important; }}
        .score-good {{ background-color: #2ecc71 !important; }}
        .score-average {{ background-color: #f39c12 !important; color: black !important; }}
        .score-below {{ background-color: #e67e22 !important; }}
        .score-poor {{ background-color: #e74c3c !important; }}
        .score-na {{ background-color: #95a5a6 !important; color: black !important; }}
        
        .summary-table th {{ background: #3498db; }}
        .scores-table th {{ background: #27ae60; }}
        .diff-table th {{ background: #e67e22; }}
        .strengths-table th {{ background: #9b59b6; }}
        
        .positive {{ color: #27ae60; font-weight: bold; }}
        .negative {{ color: #e74c3c; font-weight: bold; }}
        .warning {{ color: #f39c12; font-weight: bold; }}
        
        .radar-container {{
            text-align: center;
            margin-top: 15px;
        }}
        .radar-container img {{
            max-width: 100%;
            height: auto;
            border-radius: 8px;
        }}
        
        .grid-layout {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }}
        
        @media (max-width: 768px) {{
            .grid-layout {{
                grid-template-columns: 1fr;
            }}
        }}
        
        .competency-name {{
            text-align: left;
            font-size: 10px;
            max-width: 120px;
            word-wrap: break-word;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Manager Assessment Report</h1>
            <p>Manager: {self.email}</p>
            <p>Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="grid-layout">
            <div class="section">
                <div class="section-header">📈 Assessment Summary</div>
                <div class="section-content">
                    <table class="summary-table">
                        <thead>
                            <tr><th>Metric</th><th>Value</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Total Responses</td><td>{self.stats.get('total_responses', 0)}</td></tr>
        """
        
        # Add response breakdown
        for eval_type, data in self.stats.get('by_evaluation_type', {}).items():
            display_name = eval_type.replace('_', ' ').title().replace('Data', '')
            responses = data.get('total_responses', 0)
            html_content += f"<tr><td>{display_name} Responses</td><td>{responses}</td></tr>\n"
        
        html_content += """
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">🎯 Key Insights</div>
                <div class="section-content">
        """
        
        # Add key insights
        all_averages = {}
        for field in fields:
            scores = []
            for eval_type in ['self_data', 'manager_data', 'direct_reports_data']:
                score = self.stats['by_evaluation_type'][eval_type]['averages'].get(field)
                if score is not None:
                    scores.append(score)
            if scores:
                all_averages[field] = sum(scores) / len(scores)
        
        if all_averages:
            sorted_scores = sorted(all_averages.items(), key=lambda x: x[1], reverse=True)
            top_strength = sorted_scores[0]
            bottom_area = sorted_scores[-1]
            
            html_content += f"""
                    <p><strong>🏆 Top Strength:</strong> {top_strength[0].replace('_', ' ').title()} ({top_strength[1]:.1f})</p>
                    <p><strong>📈 Growth Area:</strong> {bottom_area[0].replace('_', ' ').title()} ({bottom_area[1]:.1f})</p>
                    <p><strong>📊 Overall Average:</strong> {sum(all_averages.values())/len(all_averages):.1f}</p>
            """
        
        html_content += """
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">🔥 Assessment Heatmap</div>
            <div class="section-content">
                <table style="font-size: 10px;">
                    <thead>
                        <tr>
                            <th>Evaluator</th>
        """
        
        # Add heatmap headers (first 12 competencies for better fit)
        short_fields = fields[:12]
        for field in short_fields:
            display_name = field.replace('_', ' ').title()[:10]
            html_content += f"<th style='font-size: 9px; max-width: 60px;'>{display_name}</th>\n"
        
        html_content += """
                        </tr>
                    </thead>
                    <tbody>
        """
        
        # Add heatmap rows
        eval_types = [
            ("Direct Report", "direct_reports_data"),
            ("Self", "self_data"), 
            ("Manager", "manager_data")
        ]
        
        def get_score_class(score):
            if score is None:
                return "score-na"
            elif score >= 4.5:
                return "score-excellent"
            elif score >= 4.0:
                return "score-good"
            elif score >= 3.5:
                return "score-average"
            elif score >= 3.0:
                return "score-below"
            else:
                return "score-poor"
        
        for display_name, eval_key in eval_types:
            html_content += f"<tr><td><strong>{display_name}</strong></td>"
            for field in short_fields:
                score = self.stats['by_evaluation_type'][eval_key]['averages'].get(field)
                score_class = get_score_class(score)
                score_text = f"{score:.1f}" if score is not None else "N/A"
                html_content += f'<td class="heatmap-cell {score_class}">{score_text}</td>'
            html_content += "</tr>\n"
        
        html_content += """
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">📊 Detailed Assessment Scores</div>
            <div class="section-content">
                <table class="scores-table">
                    <thead>
                        <tr>
                            <th class="competency-name">Competency</th>
                            <th>Self</th>
                            <th>Manager</th>
                            <th>Direct Report</th>
                            <th>Average</th>
                        </tr>
                    </thead>
                    <tbody>
        """
        
        # Add detailed scores
        for field in fields:
            field_display = field.replace('_', ' ').title()
            self_score = self.stats['by_evaluation_type']['self_data']['averages'].get(field)
            manager_score = self.stats['by_evaluation_type']['manager_data']['averages'].get(field)
            dr_score = self.stats['by_evaluation_type']['direct_reports_data']['averages'].get(field)
            
            # Calculate average
            valid_scores = [s for s in [self_score, manager_score, dr_score] if s is not None]
            avg_score = sum(valid_scores)/len(valid_scores) if valid_scores else None
            
            self_display = f"{self_score:.1f}" if self_score is not None else 'N/A'
            manager_display = f"{manager_score:.1f}" if manager_score is not None else 'N/A'
            dr_display = f"{dr_score:.1f}" if dr_score is not None else 'N/A'
            avg_display = f"{avg_score:.1f}" if avg_score is not None else 'N/A'
            
            html_content += f"""
                        <tr>
                            <td class="competency-name">{field_display}</td>
                            <td>{self_display}</td>
                            <td>{manager_display}</td>
                            <td>{dr_display}</td>
                            <td><strong>{avg_display}</strong></td>
                        </tr>
            """
        
        html_content += """
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">🔄 Perception Gaps</div>
            <div class="section-content">
                <table class="diff-table">
                    <thead>
                        <tr>
                            <th class="competency-name">Competency</th>
                            <th>Self vs DR</th>
                            <th>Self vs Mgr</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        """
        
        # Add perception differences
        for field in fields:
            field_display = field.replace('_', ' ').title()
            dr_diff = self.stats['differences'][field].get('direct_report_self_difference')
            mgr_diff = self.stats['differences'][field].get('self_manager_difference')
            
            # Determine status
            status = "✓"
            status_class = ""
            if (dr_diff is not None and abs(dr_diff) > 0.5) or (mgr_diff is not None and abs(mgr_diff) > 0.5):
                status = "⚠️"
                status_class = "warning"
            
            dr_class = "positive" if dr_diff is not None and dr_diff > 0 else ("negative" if dr_diff is not None and dr_diff < 0 else "")
            mgr_class = "positive" if mgr_diff is not None and mgr_diff > 0 else ("negative" if mgr_diff is not None and mgr_diff < 0 else "")
            
            dr_display = f"{dr_diff:+.1f}" if dr_diff is not None else 'N/A'
            mgr_display = f"{mgr_diff:+.1f}" if mgr_diff is not None else 'N/A'
            
            html_content += f"""
                        <tr>
                            <td class="competency-name">{field_display}</td>
                            <td class="{dr_class}">{dr_display}</td>
                            <td class="{mgr_class}">{mgr_display}</td>
                            <td class="{status_class}">{status}</td>
                        </tr>
            """
        
        html_content += """
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="grid-layout">
            <div class="section">
                <div class="section-header">🏆 Top Strengths</div>
                <div class="section-content">
                    <table class="strengths-table">
                        <thead>
                            <tr><th>Competency</th><th>Score</th></tr>
                        </thead>
                        <tbody>
        """
        
        # Add top 5 strengths
        if all_averages:
            top_5 = sorted(all_averages.items(), key=lambda x: x[1], reverse=True)[:5]
            for field, score in top_5:
                html_content += f"<tr><td class='competency-name'>{field.replace('_', ' ').title()}</td><td><strong>{score:.1f}</strong></td></tr>\n"
        
        html_content += """
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">📈 Growth Areas</div>
                <div class="section-content">
                    <table class="strengths-table">
                        <thead>
                            <tr><th>Competency</th><th>Score</th></tr>
                        </thead>
                        <tbody>
        """
        
        # Add bottom 5 areas
        if all_averages:
            bottom_5 = sorted(all_averages.items(), key=lambda x: x[1])[:5]
            for field, score in bottom_5:
                html_content += f"<tr><td class='competency-name'>{field.replace('_', ' ').title()}</td><td><strong>{score:.1f}</strong></td></tr>\n"
        
        html_content += """
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">📊 Visual Overview</div>
            <div class="section-content">
                <div class="radar-container">
        """
        
        # Try to include radar chart
        radar_chart_path = f"{results_dir}/assessment_radar_chart.png"
        try:
            import os
            if os.path.exists(radar_chart_path):
                html_content += f'<img src="assessment_radar_chart.png" alt="Assessment Radar Chart" />'
            else:
                html_content += '<p>Radar chart not available</p>'
        except Exception as e:
            html_content += f'<p>Chart unavailable: {str(e)}</p>'
        
        html_content += """
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        """
        
        # Write HTML file
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"🌐 Manager assessment HTML report generated: {report_path}")
        return report_path


    def get_results_directory(self):
        """
        Returns the results directory for this manager, creating it if needed.
        """
        base_path = "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/data/manager_assessment_results"
        folder_name = self.email.split('@')[0]
        full_path = f"{base_path}/{folder_name}"
        import os
        os.makedirs(full_path, exist_ok=True)
        return full_path

    def store_stats(self):
        import json
        results_dir = self.get_results_directory()
        stats_path = f"{results_dir}/assessment_stats.json"
        with open(stats_path, 'w') as f:
            json.dump(self.stats, f, indent=4)
        print(f"Stats saved at: {stats_path}")


    def build_stats(self):
        data = {
            'direct_reports_data': self.data[self.data['evaluation_type'] == 'direct_report'],
            'self_data': self.data[self.data['evaluation_type'] == 'self'],
            'manager_data': self.data[self.data['evaluation_type'] == 'manager'],
        }
        
        stats = {}

        for key, df in data.items():
            current_data = data[key]

            total_responses = len(current_data)

            fields_to_average = [
                "provides_direction_clarity",
                "builds_trust_communication",
                "resolves_conflicts_fairly",
                "adapts_leadership_style",
                "promotes_action_progress",
                "listens_other_viewpoints",
                "open_minded",
                "encourages_dialogue",
                "stays_calm_alternatives",
                "comfortable_with_change",
                "promotes_learning_adaptability",
                "learning_proactivity",
                "focuses_on_solutions",
                "shares_positive_vision",
                "sees_opportunities_not_problems",
                "learning_mindset_mistakes",
                "motivates_actionable_focus",
                # "asume_own_responsability",
                "clarity_and_vision"
            ]

            averages = {}
            for field in fields_to_average:
                if field in current_data.columns:
                    valid_responses = pd.to_numeric(current_data[field], errors='coerce').dropna()
                    if not valid_responses.empty:
                        averages[field] = valid_responses.mean()
                    else:
                        averages[field] = None
                else:
                    averages[field] = None

            # Store the averages in the stats dictionary
            stats[key] = {
                'total_responses': total_responses,
                'averages': averages
            }

        self.stats = {
            'total_responses': sum(stats[key]['total_responses'] for key in stats),
            'by_evaluation_type': stats,
            'differences': {}
        }

        for field in fields_to_average:
            # Always subtract self - other for positive = manager rates self higher
            self.stats['differences'][field] = {
                'direct_report_self_difference': (stats['self_data']['averages'][field] - stats['direct_reports_data']['averages'][field]) if stats['self_data']['averages'][field] is not None and stats['direct_reports_data']['averages'][field] is not None else None,
                'self_manager_difference': (stats['self_data']['averages'][field] - stats['manager_data']['averages'][field]) if stats['self_data']['averages'][field] is not None and stats['manager_data']['averages'][field] is not None else None,
                'direct_report_manager_difference': (stats['self_data']['averages'][field] - stats['manager_data']['averages'][field]) if stats['self_data']['averages'][field] is not None and stats['manager_data']['averages'][field] is not None else None,
            }

        # Compute top 3 positive and negative fields for each difference type
        self.stats['top_differences'] = {}
        diff_types = ['direct_report_self_difference', 'self_manager_difference', 'direct_report_manager_difference']
        for diff_type in diff_types:
            diffs = {field: self.stats['differences'][field][diff_type] for field in fields_to_average if self.stats['differences'][field][diff_type] is not None}
            # Top 3 positive (self > other)
            top3_positive = sorted([(f, v) for f, v in diffs.items() if v > 0], key=lambda x: x[1], reverse=True)[:3]
            # Top 3 negative (self < other)
            top3_negative = sorted([(f, v) for f, v in diffs.items() if v < 0], key=lambda x: x[1])[:3]
            self.stats['top_differences'][diff_type] = {
                'top3_positive': top3_positive,
                'top3_negative': top3_negative
            }


    def _load_data(self):
        query = f"SELECT * FROM slv_manager_assessment_results WHERE target_email = '{self.email}'"
        query_runner = QueryRunner()
        self.data = query_runner.run_query(query, source='postgres', dataframe=True)
    

    def build_graphics(self):
        import matplotlib.pyplot as plt
        import numpy as np
        results_dir = self.get_results_directory()
        stats = self.stats['by_evaluation_type']
        fields = list(stats['self_data']['averages'].keys())
        # Prepare data for radar chart
        labels = fields
        num_vars = len(labels)
        angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
        angles += angles[:1]
        def get_plot_values(key):
            vals = [stats[key]['averages'][f] if stats[key]['averages'][f] is not None else 0 for f in fields]
            return vals + vals[:1]
        # Radar chart
        fig, ax = plt.subplots(figsize=(5, 5), dpi=100, subplot_kw=dict(polar=True))
        for key, color, label in zip(['self_data', 'manager_data', 'direct_reports_data'], ['dodgerblue', 'crimson', 'limegreen'], ['Self', 'Manager', 'Direct Report']):
            values = get_plot_values(key)
            ax.plot(angles, values, label=label, color=color, linewidth=2)
            ax.fill(angles, values, color=color, alpha=0.15)
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(labels, fontsize=7)
        ax.set_yticklabels([])
        ax.set_title('Assessment Radar Chart', fontsize=10, y=1.08)
        ax.legend(loc='upper right', bbox_to_anchor=(1.2, 1.1), fontsize=7)
        radar_path = f"{results_dir}/assessment_radar_chart.png"
        plt.tight_layout()
        plt.savefig(radar_path)
        plt.close(fig)

        # Dot plot
        fig, ax = plt.subplots(figsize=(8, 4), dpi=100)
        x = np.arange(len(fields))
        width = 0.2
        for idx, (key, color, label) in enumerate(zip(['self_data', 'manager_data', 'direct_reports_data'], ['dodgerblue', 'crimson', 'limegreen'], ['Self', 'Manager', 'Direct Report'])):
            y = [stats[key]['averages'][f] if stats[key]['averages'][f] is not None else 0 for f in fields]
            ax.scatter(x + idx*width, y, label=label, color=color)
        ax.set_xticks(x + width)
        ax.set_xticklabels(fields, rotation=45, ha='right', fontsize=7)
        ax.set_ylabel('Average Score')
        ax.set_title('Assessment Averages by Type', fontsize=10)
        ax.legend(fontsize=7)
        plt.tight_layout()
        dot_path = f"{results_dir}/assessment_dot_plot.png"
        plt.savefig(dot_path)
        plt.close(fig)
    def get_results_directory(self):
        base_path = "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/data/manager_assessment_results"
        folder_name = self.email.split('@')[0]
        full_path = f"{base_path}/{folder_name}"
        import os
        os.makedirs(full_path, exist_ok=True)
        return full_path



class ManagerAssessmentReportCreator:
    def __init__(self):
        self.yep = 'hola'

    def load_manager_assessment_data(self):
        print("Loading manager assessment data...")

        direct_reports_files = [
            "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/data/manager_assessment_raw_data/Valoración del liderazgo de tu manager (Responses).xlsx",
            "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/data/manager_assessment_raw_data/Leadership Assessment of Your Manager (Responses).xlsx",
        ]

        self_assessment_files = [
            "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/data/manager_assessment_raw_data/Assessment_ Fotografía de Liderazgo y Flexibilidad (Responses).xlsx",
            "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/data/manager_assessment_raw_data/Assessment_ Leadership and Flexibility (Responses).xlsx",
        ]

        managers_assessment_files = [
            "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/data/manager_assessment_raw_data/Valoración del liderazgo de tu direct report (Responses).xlsx"
        ]

        field_identifiers = {
            'respondent_email': ["Email Address", "respondent_email"],
            'manager_name': [
                # Most specific first
                "nombre y apellido", "first and last name", "nombre del manager", "name of your manager", "nombre de tu manager",
                "nombre y apellido de tu manager", "manager's name", "direct report name", "nombre y apellido de tu direct report",
                # Only match 'manager' or 'direct report' if part of a longer phrase
                "manager_name", "direct_report_name"
            ],
            'provides_direction_clarity': [
                "provides direction", "da dirección", 'la dirección', "take the lead", "asume con naturalidad la dirección", "natural for me to take the lead"
            ],
            'builds_trust_communication': [
                "builds trust", "genera confianza", "inspira confianza", "inspire trust", "forma de comunicar"
            ],
            'resolves_conflicts_fairly': [
                "resolve conflicts", "resolverlos de manera justa", "conflictos", "fair and constructive", "soluciones que beneficien a todo el equipo", "conflicts arise",
            ],
            'adapts_leadership_style': [
                "adjust their leadership sty", "adaptar mi estilo de liderazgo según", "adjust leadership style", "ajusta su forma de liderar", "adapta su estilo de liderazgo", "adapt my leadership style"
            ],
            'promotes_action_progress': [
                "promote action", "promueve la acción", "focus more on making things happen", "hacer que las cosas sucedan"
            ],
            'inspirational_moment': [
                "inspired you", "te inspiró", "helped you move forward", "situación reciente", "led effectively"
            ],
            'listens_other_viewpoints': [
                " escuchar y considerar punto", "en to and consider viewpoint", "incluso cuando no está ", "n when I don’t agree with the other p", "cucho activamente incluso cuando no"
            ],
            'open_minded': [
                "iar de opinión fácilmen", "my mind easily when som", "erto/a a cambiar de opinión cuan"
            ],
            'encourages_dialogue': [
                "encourage dialogue", "fomenta el diálogo", "participación"
            ],
            'stays_calm_alternatives': [
                "remain calm", "mantiene la calma", "explore new options", "reacciona con calma", "algo no sale como esperaba, suelo explorar nueva"
            ],
            'comfortable_with_change': [
                "feel comfortable with uncertaint", "iente cómodo/a ante la incertidu", "rtable when things are not complete", "comfortable with change", "cómodo ante la incertidumbre", "situaciones ambiguas", "cosas no están completamente claras"
            ],
            'promotes_learning_adaptability': [
                "promote learning", "promueve el aprendizaje", "adaptabilidad"
            ],
            'learning_proactivity': [
                "disfruta aprender", "enjoy learning new things", "Disfruto aprender"
            ],
            'flexibility_example': [
                "shown flexibility", "mostrado apertura", "openness or flexibility", "adapt quickly", " que tuviste que cambiar de enfoque o adaptarte rápidamente"
            ],
            'focuses_on_solutions': [
                " faced with a problem, I think f", "focus on solutions", "mantiene el foco en las soluciones", "buscar soluciones", "pienso primero en cómo resolverlo antes"
            ],
            'shares_positive_vision': [
                "positive vision", "visión positiva", "visión clara"
            ],
            'sees_opportunities_not_problems': [
                " very negative, I usually he", "see opportunities", "ver oportunidades", "lado constructivo"
            ],
            'learning_mindset_mistakes': [
                "imitations can be opportunit", "learning mindset", "actitud de aprendizaje", "oportunidades para aprender"
            ],
            'motivates_actionable_focus': [
                "hen something goes wrong, I look for what I can", "focus on what can be done", "enfocarse en lo que sí se puede", "ajustar o mejorar"
            ],
            'constructive_focus_example': [
                "cent challenge. How did you manage to main", "constructive focus", "enfoque positivo o constructivo", "mirada constructiva"
            ],
            'asume_own_responsability': [
                "asume responsabilidad", "responsabilidad por los resultados"
            ],
            'leading_challenges': [
                "most challenging about leading", "desafiante al liderar"
            ],
            'leading_change': [
                "change one thing about your leadership", "cambiar una sola cosa en tu forma de liderar"
            ],
            'clarity_and_vision': [
                "visualize the ideal scenario", "visualizar el escenario ideal"
            ],
            'motivation_for_leading': [
                "t motivates you most to", "motivates you most to lead", "motiva hoy a liderar"
            ]
        }

        # Define keywords for evaluation type classification (to be provided by user)
        evaluation_keywords = {
            'manager': ["liderazgo de tu direct report"],
            'direct_report': ['Assessment of Your Manager', 'liderazgo de tu manager'],
            'self': ['Fotografía de Liderazgo', 'Leadership and Flexibility']
        }

        self.loader = Loader()

        all_results = []
        for file in direct_reports_files + self_assessment_files + managers_assessment_files:
            df = pd.read_excel(file, sheet_name='Form Responses 1')
            new_df = self._map_fields_to_standard_columns(df, field_identifiers)
            file_short = file.split('/')[-1]
            new_df['source_file'] = file_short
            new_df['evaluation_type'] = self._get_evaluation_type(file_short, evaluation_keywords)
            all_results.append(new_df)
        # Join all results in a single DataFrame
        if all_results:
            final_df = pd.concat(all_results, ignore_index=True)
        else:
            final_df = pd.DataFrame()

        self.loader.load_from_dataframe(final_df, "file_manager_assessment_raw_data")

    def process_manager_assessment_data(self):
        print("Processing manager assessment data...")
        dbt_runner = DBTRunner()
        dbt_runner.run_dbt_model_upstream("slv_manager_assessment_results")

    def generate_report(self):
        print("Generating manager assessment report...")
        # Logic to generate the manager assessment report
        report = f"Manager Assessment Report:\n{self.yep}"
        print(report)
        return report

    def _get_evaluation_type(self, file_name, keywords):
        """
        Classify the evaluation type based on the file name and provided keywords.
        Returns one of: 'manager', 'direct_report', 'self', or 'unknown'.
        """
        lower_file = file_name.lower()
        if any(word.lower() in lower_file for word in keywords.get('manager', [])):
            return 'manager'
        if any(word.lower() in lower_file for word in keywords.get('direct_report', [])):
            return 'direct_report'
        if any(word.lower() in lower_file for word in keywords.get('self', [])):
            return 'self'
        return 'unknown'
    
    def _map_fields_to_standard_columns(self, df, field_identifiers):
        """
        Given a DataFrame and a dict of field_identifiers, return a new DataFrame with columns mapped to the standard names.
        """
        new_data = {}
        for new_col, possible_fields in field_identifiers.items():
            found = None
            for field in possible_fields:
                for col in df.columns:
                    if field.lower() in col.lower():
                        found = col
                        break
                if found:
                    break
            if found:
                new_data[new_col] = df[found]
            else:
                new_data[new_col] = [None] * len(df)
        return pd.DataFrame(new_data)
