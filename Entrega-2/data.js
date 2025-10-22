const categoryConfig = {
    'Invasiones Terrestres': {
        color: '#DC2626',
        icon: '🪖',
        soundFile: 'assets/sounds/marcha.mp3'
    },
    'Bombardeos y Ataques Aéreos': {
        color: '#F59E0B',
        icon: '✈️',
        soundFile: 'assets/sounds/sirena.mp3'
    },
    'Operaciones Especiales': {
        color: '#10B981',
        icon: '🎯',
        soundFile: 'assets/sounds/radio.mp3'
    },
    'Atentados Terroristas': {
        color: '#8B5CF6',
        icon: '💥',
        soundFile: 'assets/sounds/explosion.mp3'
    },
    'Crisis Políticas': {
        color: '#3B82F6',
        icon: '🏛️',
        soundFile: 'assets/sounds/conversacion.mp3'
    },
    'Crisis Económicas': {
        color: '#EC4899',
        icon: '📉',
        soundFile: 'assets/sounds/monedas.mp3'
    }
};

const crisisEvents=[{date:"1983-10-25",crisis:100,event:"Invasión Granada",category:"Invasiones Terrestres"},{date:"1987-10-19",crisis:75,event:"Lunes Negro",category:"Crisis Económicas"},{date:"1989-12-20",crisis:125,event:"Invasión Panamá",category:"Invasiones Terrestres"},{date:"1990-08-01",crisis:116,event:"Guerra del Golfo",category:"Invasiones Terrestres"},{date:"1991-08-21",crisis:157,event:"Golpe URSS",category:"Crisis Políticas"},{date:"1993-10-02",crisis:63,event:"Batalla de Mogadiscio",category:"Operaciones Especiales"},{date:"1994-09-18",crisis:80,event:"Invasión Haití",category:"Invasiones Terrestres"},{date:"1995-11-17",crisis:110,event:"Escandálo de Lewinsky",category:"Crisis Políticas"},{date:"1998-08-20",crisis:200,event:"Bombardeos Sudán/Afganistán",category:"Bombardeos y Ataques Aéreos"},{date:"1998-12-16",crisis:175,event:"Bombardeo de Irak/Desert Fox",category:"Bombardeos y Ataques Aéreos"},{date:"1999-03-23",crisis:150,event:"Bombardeo Yugoslavia/Kosovo",category:"Bombardeos y Ataques Aéreos"},{date:"2001-09-11",crisis:220,event:"11 de Septiembre",category:"Atentados Terroristas"},{date:"2001-10-07",crisis:125,event:"Invasión Afganistán",category:"Invasiones Terrestres"},{date:"2003-03-19",crisis:135,event:"Invasión Iraq",category:"Invasiones Terrestres"},{date:"2011-03-19",crisis:170,event:"Intervención Libia",category:"Crisis Políticas"},{date:"2011-05-01",crisis:115,event:"Raid Bin Laden",category:"Operaciones Especiales"},{date:"2017-04-06",crisis:140,event:"Bombardeo Siria",category:"Bombardeos y Ataques Aéreos"},{date:"2018-04-13",crisis:160,event:"Bombardeos Siria Multi",category:"Bombardeos y Ataques Aéreos"},{date:"2019-10-26",crisis:95,event:"Raid ISIS Baghdadi",category:"Operaciones Especiales"},{date:"2020-01-02",crisis:135,event:"Asesinato Soleimani",category:"Operaciones Especiales"},{date:"2021-08-26",crisis:115,event:"Atentado Kabul",category:"Atentados Terroristas"},{date:"2022-02-23",crisis:130,event:"Invasión Ucrania",category:"Invasiones Terrestres"},{date:"2024-04-13",crisis:170,event:"Ataque Israel-Irán",category:"Operaciones Especiales"},{date:"2025-06-12",crisis:180,event:"Bombardeos Israel-Irán",category:"Bombardeos y Ataques Aéreos"},{date:"2025-08-29",crisis:170,event:"Rumores #TrumpIsDead",category:"Crisis Políticas"}];

const baselineData=[25,25,22,22,22,20,20,20,24,24,25,25,25,25,22,22,22,20,20,20,24,24,25,25,25,25,22,22,22,20,20,20,24,24,25,25,27,27,23,23,23,21,21,21,25,25,27,27,28,28,25,25,25,22,22,22,27,27,28,28,30,30,26,26,26,24,24,24,29,29,30,30,32,32,28,28,28,25,25,25,30,30,32,32,34,34,29,29,29,26,26,26,32,32,34,34,35,35,31,31,31,28,28,28,34,34,35,35,37,37,33,33,33,29,29,29,36,36,37,37,39,39,34,34,34,31,31,31,38,38,39,39,41,41,36,36,36,32,32,32,39,39,41,41,43,43,38,38,38,34,34,34,41,41,43,43,45,45,40,40,40,36,36,36,43,43,45,45,48,48,42,42,42,37,37,37,46,46,48,48,50,50,44,44,44,39,39,39,48,48,50,50,52,52,46,46,46,41,41,43,50,50,52,52,55,55,48,48,48,43,43,43,52,52,55,55,56,56,49,49,49,44,44,44,54,54,56,56,58,58,50,50,50,45,45,45,55,55,58,58,59,59,52,52,52,46,46,46,57,57,59,59,61,61,53,53,53,48,48,48,58,58,61,61,62,62,54,54,54,49,49,49,60,60,62,62,64,64,55,55,55,50,50,50,61,61,64,64,65,65,57,57,57,51,51,51,62,62,65,65,66,66,58,58,58,52,52,52,63,63,66,66,68,68,59,59,59,53,53,53,65,65,68,68,69,69,60,60,60,54,54,54,66,66,69,69,71,71,62,62,62,55,55,55,68,68,71,71,72,72,63,63,63,57,57,57,69,69,72,72,74,74,65,65,65,58,58,58,71,71,74,74,76,76,66,66,66,59,59,59,73,73,76,76,78,78,68,68,68,61,61,61,74,74,78,78,80,80,69,69,69,62,62,62,76,76,80,80,82,82,71,71,71,64,64,64,78,78,82,82,84,84,73,73,73,66,66,66,80,80,84,84,86,86,75,75,75,67,67,67,82,82,86,86,88,88,77,77,77,69,69,69,84,84,88,88,91,91,79,79,79,71,71,71,87,87,91,91,94,94,82,82,82,74,74,74,90,90,94,94,95,95,83,83,83,75,75,75,91,91,95,95,97,97,84,84,84,76,76,76,92,92,97,97,98,98,85,85,85,77,77,77,94,94,98,98];

function getMonthIndex(dateStr) {
    const [year, month] = dateStr.split('-').map(Number);
    return ((year - 1983) * 12) + (month - 1);
}

function generateMonthlyData(activeCategories) {
    const monthlyData = [];
    const crisisMap = new Map(crisisEvents.map(e => [e.date.substring(0, 7), e]));

    for (let year = 1983; year <= 2025; year++) {
        for (let month = 1; month <= 12; month++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}`;
            const monthIndex = ((year - 1983) * 12) + (month - 1);

            if (monthIndex >= baselineData.length) {
                break; 
            }

            const baseline = baselineData[monthIndex];
            const event = crisisMap.get(dateStr);

            let excess = 0;
            if (event && activeCategories.has(event.category)) {
                if (typeof baseline === 'number') {
                    excess = Math.max(0, event.crisis - baseline);
                }
            }

            monthlyData.push({
                date: dateStr,
                baseline,
                excess,
                event: (event && activeCategories.has(event.category)) ? event : null
            });
        }
    }

    return monthlyData;
}

