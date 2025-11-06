// Módulo para exportar reportes: PDF (jsPDF) y Excel/CSV (SheetJS)
(function(){
    function exportReportPDF(reportTitle, rows) {
        // Try to get jsPDF ctor
        const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
        if (!jsPDFCtor) {
            alert('jsPDF no cargado. No se puede exportar a PDF.');
            return;
        }

        const doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });
        const margin = 40;
        let y = 60;
        doc.setFontSize(16);
        doc.text(reportTitle || 'Reporte de Asistencias', margin, y);
        y += 24;

        doc.setFontSize(11);
        rows = rows || [];
        const colWidths = [120, 200, 120];

        rows.forEach((r, i) => {
            if (y > 750) { doc.addPage(); y = 60; }
            doc.text(String(r[0] || ''), margin, y);
            doc.text(String(r[1] || ''), margin + 130, y);
            doc.text(String(r[2] || ''), margin + 350, y);
            y += 18;
        });

        const fileName = `reporte_asistencias_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    function exportReportExcel(rows, sheetName) {
        if (!window.XLSX) {
            alert('SheetJS (XLSX) no cargado. No se puede exportar a Excel.');
            return;
        }

        rows = rows || [];
        const ws = window.XLSX.utils.aoa_to_sheet([['Fecha', 'Alumno/Curso', 'Estado']].concat(rows));
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Asistencias');
        const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_asistencias_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
    }

    window.exportReportPDF = exportReportPDF;
    window.exportReportExcel = exportReportExcel;
})();
