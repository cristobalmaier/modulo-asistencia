// Dashboard: calcula y muestra estadísticas simples en el cliente
(function(){
    function computeAttendanceStats() {
        let attendanceData = {};
        try { attendanceData = JSON.parse(localStorage.getItem('attendanceData') || '{}'); } catch(e) { attendanceData = {}; }

        let total = 0, present = 0;
        const absenceCount = {}; // name -> inasistencias

        for (const date in attendanceData) {
            const day = attendanceData[date];
            for (const id in day) {
                const s = day[id];
                total++;
                if (s.presente || s.present) present++;
                if (!s.presente && !s.present) {
                    // incrementar contador de inasistencias
                    const name = s.nombre || s.name || ('alumno_'+id);
                    absenceCount[name] = (absenceCount[name] || 0) + 1;
                }
            }
        }

        const percent = total === 0 ? 0 : Math.round((present / total) * 100);

        // Top inasistentes
        const top = Object.entries(absenceCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

        return { total, present, percent, top };
    }

    function loadUpcomingEvents() {
        try {
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            return events.slice(0,5);
        } catch(e) { return []; }
    }

    function renderDashboard() {
        const stats = computeAttendanceStats();
        const percentEl = document.getElementById('attendancePercent');
        if (percentEl) percentEl.textContent = stats.percent + '%';

        const topList = document.getElementById('topAbsenteesList');
        if (topList) {
            topList.innerHTML = stats.top.length ? stats.top.map(t => `<li>${t[0]} — ${t[1]} inasistencias</li>`).join('') : '<li>No hay inasistencias registradas</li>';
        }

        const events = loadUpcomingEvents();
        const eventsList = document.getElementById('upcomingEventsList');
        if (eventsList) {
            eventsList.innerHTML = events.length ? events.map(ev => `<li><strong>${ev.date}</strong> — ${ev.title}</li>`).join('') : '<li>No hay eventos próximos</li>';
        }

        // preparar datos para export
        const sampleRows = [];
        try {
            const attendanceData = JSON.parse(localStorage.getItem('attendanceData') || '{}');
            for (const date in attendanceData) {
                const day = attendanceData[date];
                for (const id in day) {
                    const s = day[id];
                    sampleRows.push([date, (s.nombre||s.name||id) + ' / ' + (s.curso||s.course||''), (s.presente||s.present) ? 'Presente' : 'Ausente']);
                }
            }
        } catch(e) { /* ignore */ }

        // attach export buttons
        document.getElementById('btnExportPDF')?.addEventListener('click', () => {
            window.exportReportPDF && window.exportReportPDF('Reporte de Asistencias - Resumen', sampleRows.slice(0,200));
        });

        document.getElementById('btnExportExcel')?.addEventListener('click', () => {
            window.exportReportExcel && window.exportReportExcel(sampleRows, 'Asistencias');
        });

        document.getElementById('btnSendNotification')?.addEventListener('click', async () => {
            const to = prompt('Enviar notificación a (nombre o rol):', 'padre');
            if (!to) return;
            const msg = prompt('Mensaje:','Se registró una inasistencia.');
            if (!msg) return;
            window.pushNotificationSimulate && window.pushNotificationSimulate(to, msg, { via: 'dashboard' });
            alert('Notificación enviada (simulada)');
        });

        document.getElementById('btnOpenMessaging')?.addEventListener('click', () => {
            if (window.openMessagingPanel) window.openMessagingPanel();
        });
    }

    function initDashboard() {
        // Guardar rol actual para que modulitos puedan leerlo
        try { localStorage.setItem('currentRole', (document.getElementById('currentRole')?.textContent) || 'usuario'); } catch(e){}
        renderDashboard();
    }

    window.initDashboard = initDashboard;
})();
