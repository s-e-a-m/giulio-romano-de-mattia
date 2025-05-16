// assets/js/mappatura-armonica-chart.js

document.addEventListener('DOMContentLoaded', function() {

    // --- 0. Parametro di Discretizzazione ---
    const LIVELLI_K = 50; // Mantienilo modificabile per testare (es. 20, 50, 100)

    // --- 1. Funzione di Mappatura Unica (versione JavaScript) ---
    function calcolaStatoArmonicoUnicoJS(centroide, densita, spread, livelli_k) {
        if (!(0 <= centroide && centroide <= 1 && 0 <= densita && densita <= 1 && 0 <= spread && spread <= 1)) {
            console.error("Errore: I parametri devono essere nell'intervallo [0, 1]", { centroide, densita, spread });
            return null;
        }

        let centroide_int = Math.round(centroide * (livelli_k - 1));
        let densita_int = Math.round(densita * (livelli_k - 1));
        let spread_int = Math.round(spread * (livelli_k - 1));

        centroide_int = Math.max(0, Math.min(livelli_k - 1, centroide_int));
        densita_int = Math.max(0, Math.min(livelli_k - 1, densita_int));
        spread_int = Math.max(0, Math.min(livelli_k - 1, spread_int));

        const valore_unico_int = (centroide_int * (livelli_k * livelli_k) +
            densita_int * livelli_k +
            spread_int);

        if (livelli_k === 1) return 0.0;

        const max_val_int = ((livelli_k - 1) * (livelli_k * livelli_k) +
            (livelli_k - 1) * livelli_k +
            (livelli_k - 1));

        if (max_val_int === 0) return 0.0;

        return valore_unico_int / max_val_int;
    }

    // --- 2. Definizione degli Stati Tipici e di Interesse ---
    const valB = 0.1, valM = 0.5, valA = 0.9;
    const statiConfigJS = [
        { nome: "Minimo (0,0,0)", d: 0.0, s: 0.0, c: 0.0 },
        { nome: `B-B-B (D:${valB},S:${valB},C:${valB})`, d: valB, s: valB, c: valB },
        { nome: `M-M-M (D:${valM},S:${valM},C:${valM})`, d: valM, s: valM, c: valM },
        { nome: `A-A-A (D:${valA},S:${valA},C:${valA})`, d: valA, s: valA, c: valA },
        { nome: "Massimo (1,1,1)", d: 1.0, s: 1.0, c: 1.0 },
        { nome: "Solo C Alto (D:0,S:0,C:1)", d: 0.0, s: 0.0, c: 1.0 },
        { nome: "Solo D Alta (D:1,S:0,C:0)", d: 1.0, s: 0.0, c: 0.0 },
        { nome: "Solo S Alto (D:0,S:1,C:0)", d: 0.0, s: 1.0, c: 0.0 },
        // Stati "Quasi Uguali" per testare l'effetto della discretizzazione
        { nome: "Quasi 1a (C:0.78)", d: 0.5, s: 0.5, c: 0.78 },
        { nome: "Quasi 1b (C:0.81)", d: 0.5, s: 0.5, c: 0.81 },
        { nome: "Quasi 2a (S:0.23)", d: 0.5, s: 0.23, c: 0.5 },
        { nome: "Quasi 2b (S:0.28)", d: 0.5, s: 0.28, c: 0.5 },
        // Stati che erano conflitti nella formula originale ponderata, ora dovrebbero essere distinti
        // Nota: "Solo C Alto" copre già (C:1,D:0,S:0)
        { nome: "Ex-Conflitto (C:0,D:1,S:1)", d: 1.0, s: 1.0, c: 0.0 },
    ];

    const statiDatiJS = statiConfigJS.map(stato => {
        const saUnico = calcolaStatoArmonicoUnicoJS(stato.c, stato.d, stato.s, LIVELLI_K);
        return {
            ...stato,
            sa_unico: saUnico,
            c_int: Math.max(0, Math.min(LIVELLI_K - 1, Math.round(stato.c * (LIVELLI_K - 1)))),
            d_int: Math.max(0, Math.min(LIVELLI_K - 1, Math.round(stato.d * (LIVELLI_K - 1)))),
            s_int: Math.max(0, Math.min(LIVELLI_K - 1, Math.round(stato.s * (LIVELLI_K - 1)))),
        };
    });
    console.log("Stati Dati Calcolati (JS):", statiDatiJS);

    // --- 3. Generazione di una Griglia di Punti per lo Spazio 3D ---
    const gridData = { d: [], s: [], c: [], sa_unico: [] };
    const nPuntiAsseGrid = 7; // Come nella versione Python
    for (let i = 0; i < nPuntiAsseGrid; i++) {
        const valD = i / (nPuntiAsseGrid - 1);
        for (let j = 0; j < nPuntiAsseGrid; j++) {
            const valS = j / (nPuntiAsseGrid - 1);
            for (let k = 0; k < nPuntiAsseGrid; k++) {
                const valC = k / (nPuntiAsseGrid - 1);
                gridData.d.push(valD);
                gridData.s.push(valS);
                gridData.c.push(valC);
                gridData.sa_unico.push(calcolaStatoArmonicoUnicoJS(valC, valD, valS, LIVELLI_K));
            }
        }
    }

    // --- 4. Preparazione dei Dati per Plotly ---

    // Traccia per la griglia di sfondo 3D (assegnata a scene 'scene1')
    const tracciaGriglia3D = {
        x: gridData.d, y: gridData.s, z: gridData.c,
        mode: 'markers', type: 'scatter3d',
        marker: {
            size: 3, color: gridData.sa_unico, colorscale: 'Plasma', opacity: 0.3,
            colorbar: { title: 'SA Unico', x: 1.0, thickness: 15 }
        },
        hoverinfo: 'text',
        hovertext: gridData.d.map((d, i) => `D:${d.toFixed(2)}, S:${gridData.s[i].toFixed(2)}, C:${gridData.c[i].toFixed(2)}<br>SA_unico: ${gridData.sa_unico[i].toFixed(3)}`),
        name: "Griglia Spazio Parametri",
        scene: 'scene1' // Assegna questa traccia alla prima scena (il grafico 3D)
    };

    // Traccia per gli stati definiti 3D (assegnata a scene 'scene1')
    const tracciaStati3D = {
        x: statiDatiJS.map(s => s.d), y: statiDatiJS.map(s => s.s), z: statiDatiJS.map(s => s.c),
        mode: 'markers+text', type: 'scatter3d',
        marker: {
            size: 8, color: statiDatiJS.map(s => s.sa_unico), colorscale: 'Plasma',
            opacity: 1, line: { color: 'black', width: 1 }
        },
        text: statiDatiJS.map(s => s.sa_unico.toFixed(3)),
        textposition: 'top center',
        hoverinfo: 'text',
        hovertext: statiDatiJS.map(s => `<b>${s.nome}</b><br>D:${s.d.toFixed(2)}, S:${s.s.toFixed(2)}, C:${s.c.toFixed(2)}<br><b>SA_unico: ${s.sa_unico.toFixed(4)}</b><br>Indici:(${s.c_int},${s.d_int},${s.s_int})`),
        name: "Stati Definiti",
        scene: 'scene1' // Assegna anche questa traccia alla prima scena
    };

    // Logica migliorata per sfalsare i punti sulla scala 1D
    let yValues1D = new Array(statiDatiJS.length).fill(0);
    const precisionGrouping = 8; 
    const saUnicoMap = new Map(); // Per tracciare SA_unico e i loro offset y

    // Raggruppa gli indici per SA_unico arrotondato
    const groupedBySA = statiDatiJS.reduce((acc, stato, index) => {
        const saRounded = parseFloat(stato.sa_unico.toFixed(precisionGrouping));
        if (!acc[saRounded]) {
            acc[saRounded] = [];
        }
        acc[saRounded].push({ ...stato, originalIndex: index });
        return acc;
    }, {});
    
    let currentGlobalYLevel = 0;
    const yIncrementBase = 0.08; // Incremento y di base per gruppi
    const yIncrementIntraGroup = 0.04; // Incremento y più piccolo all'interno di un gruppo

    // Ordina gli SA_unico arrotondati per un processamento consistente
    const sortedSAKeys = Object.keys(groupedBySA).map(Number).sort((a, b) => a - b);

    sortedSAKeys.forEach(saKey => {
        const group = groupedBySA[saKey];
        if (group.length > 1) { // È un "conflitto di discretizzazione" o duplicato
            let intraGroupOffset = 0;
            group.forEach(statoInGroup => {
                yValues1D[statoInGroup.originalIndex] = currentGlobalYLevel * yIncrementBase + intraGroupOffset;
                intraGroupOffset += yIncrementIntraGroup;
            });
            currentGlobalYLevel++; // Passa al prossimo livello y globale per il prossimo gruppo
        } else { // Singolo stato, posizionalo su y=0 (o sulla linea base)
             yValues1D[group[0].originalIndex] = 0;
        }
    });


    // Traccia per gli stati mappati sulla scala 1D (assegnata agli assi 'xaxis1', 'yaxis1')
    const tracciaStati1D = {
        x: statiDatiJS.map(s => s.sa_unico),
        y: yValues1D,
        mode: 'markers+text', type: 'scatter',
        marker: {
            size: 10, color: statiDatiJS.map(s => s.sa_unico),
            colorscale: 'Plasma', showscale: false
        },
        text: statiDatiJS.map(s => s.nome.split(" (")[0]),
        textposition: 'top right', textfont: { size: 9 },
        hoverinfo: 'text',
        hovertext: statiDatiJS.map(s => `<b>${s.nome}</b><br><b>SA: ${s.sa_unico.toFixed(4)}</b><br>(D:${s.d.toFixed(2)},S:${s.s.toFixed(2)},C:${s.c.toFixed(2)})`),
        name: "Stati Mappati su 1D",
        xaxis: 'x1', // Assegna all'asse x principale
        yaxis: 'y1'  // Assegna all'asse y principale (che configureremo per il grafico 1D)
    };

    // --- 5. Definizione del Layout e Disegno del Grafico Plotly ---
    const layout = {
        title: `Mappatura Dimensionale Unica (k=${LIVELLI_K}) - Plotly.js`,
        height: 900,
        // Definiamo la prima scena (per il grafico 3D)
        scene1: {
            domain: { y: [0.35, 1], x: [0, 1] }, // Occupa la parte superiore
            xaxis: { title: 'Densità (D)', range: [0, 1], nticks: 5 },
            yaxis: { title: 'Spread (S)', range: [0, 1], nticks: 5 },
            zaxis: { title: 'Centroide (C)', range: [0, 1], nticks: 5 },
            aspectmode: 'cube',
            camera: { eye: {x: 1.5, y: 1.5, z: 1.5} } // Imposta una vista iniziale
        },
        // Definiamo gli assi per il grafico 1D (il grafico 2D in basso)
        xaxis1: { // Questo sarà l'asse X del grafico 1D
            domain: { y: [0, 0.25], x: [0.1, 0.9] }, // Occupa la parte inferiore, con margini laterali
            title: 'Valore Stato Armonico Unico (SA_unico)',
            range: [-0.05, 1.05],
            anchor: 'y1' // Ancorato all'asse y1
        },
        yaxis1: { // Questo sarà l'asse Y del grafico 1D
            domain: { y: [0, 0.25], x: [0.1, 0.9] },
            showticklabels: false,
            showgrid: false,
            zeroline: true, zerolinewidth: 1, zerolinecolor: 'grey',
            anchor: 'x1', // Ancorato all'asse x1
            range: [-0.05, Math.max(...yValues1D, 0.1) * 1.5 + yIncrementBase ] // Adatta il range dinamicamente
        },
        legend: {
            orientation: "h",
            yanchor: "bottom", y: 1.02, // Leggermente sopra il grafico 3D
            xanchor: "center", x: 0.5
        },
        margin: { l: 50, r: 50, b: 80, t: 80 }, // Aumentato b e t per titoli assi/grafico
        // Annotazioni per i titoli dei subplot (un po' un workaround in Plotly.js per subplot misti)
        annotations: [
            {
                text: `Spazio 3D Parametri (k=${LIVELLI_K})`,
                xref: 'paper', yref: 'paper',
                x: 0.5, y: 0.95, // Posizione relativa all'area del grafico 3D
                showarrow: false,
                font: { size: 14 },
                xanchor: 'center', yanchor: 'bottom'
            },
            {
                text: "Mappatura su Scala 1D dello Stato Armonico Unico",
                xref: 'paper', yref: 'paper',
                x: 0.5, y: 0.22, // Posizione relativa all'area del grafico 1D
                showarrow: false,
                font: { size: 14 },
                xanchor: 'center', yanchor: 'bottom'
            }
        ]
    };

    const tutteLeTracce = [tracciaGriglia3D, tracciaStati3D, tracciaStati1D];
    const chartContainerId = 'mappaturaArmonicaPlotlyChart';
    const chartDiv = document.getElementById(chartContainerId);

    if (chartDiv) {
        Plotly.newPlot(chartContainerId, tutteLeTracce, layout, {responsive: true});
        console.log("Grafico Plotly.js complesso dovrebbe essere renderizzato.");

        // Analisi conflitti (identica a prima, per il debug)
        console.log("\n--- Analisi 'Conflitti di Discretizzazione' (JS) ---");
        const conflittiTrovati = {};
        statiDatiJS.forEach(stato => {
            const saArrotondato = parseFloat(stato.sa_unico.toFixed(precisionGrouping));
            if (!conflittiTrovati[saArrotondato]) {
                conflittiTrovati[saArrotondato] = [];
            }
            conflittiTrovati[saArrotondato].push(stato);
        });
        let ciSonoConflitti = false;
        for (const saVal in conflittiTrovati) {
            if (conflittiTrovati[saVal].length > 1) {
                ciSonoConflitti = true;
                console.log(`SA_unico: ${parseFloat(saVal).toFixed(4)} generato da ${conflittiTrovati[saVal].length} stati:`);
                conflittiTrovati[saVal].forEach(stato => {
                    console.log(`  - ${stato.nome} (C:${stato.c.toFixed(2)}, D:${stato.d.toFixed(2)}, S:${stato.s.toFixed(2)}) -> Indici C,D,S: (${stato.c_int},${stato.d_int},${s.s_int})`);
                });
            }
        }
        if (!ciSonoConflitti) {
            console.log(`Nessuno degli stati definiti ha prodotto lo stesso SA_unico con k = ${LIVELLI_K}`);
        }

    } else {
        console.error(`Errore: Elemento div con ID '${chartContainerId}' non trovato.`);
    }
});