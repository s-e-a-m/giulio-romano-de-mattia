document.addEventListener('DOMContentLoaded', function() {
  const faustEditorElement = document.querySelector('faust-editor');

  if (faustEditorElement && faustEditorElement.shadowRoot) {
    const shadow = faustEditorElement.shadowRoot;

    // Crea un elemento <style>
    const style = document.createElement('style');
    style.textContent = `
      #root {
        /* Fa in modo che #root occupi tutta l'altezza del faust-editor */
        height: 100%;
        display: flex; /* Utile se #controls e #content devono dividersi lo spazio verticalmente */
        flex-direction: column;
      }

      #content {
        /* Fa in modo che #content prenda lo spazio rimanente dopo #controls */
        flex-grow: 1;
        overflow: auto; /* Aggiunge scrollbar se il contenuto dell'editor è più grande */
        /* Potresti dover specificare un'altezza minima o forzare un'altezza qui se flex-grow non basta */
        /* height: calc(100% - 50px); /* Esempio: se #controls è alto 50px */
      }

      /* Se l'editor interno è CodeMirror (molto comune) */
      /* Ispeziona per vedere la classe effettiva dell'editor, potrebbe essere .CodeMirror o simile */
      #content .CodeMirror { /* Assumendo che CodeMirror sia figlio diretto o indiretto di #content */
        height: 100% !important; /* Forza CodeMirror a riempire #content */
        width: 100% !important;
      }

      /* Se non è CodeMirror, cerca la classe/id dell'elemento editor effettivo dentro #content */
      /* Esempio:
      #content #actual-editor-id {
        height: 100% !important;
      }
      */
    `;

    // Aggiungi lo <style> allo Shadow DOM
    shadow.appendChild(style);

    // A volte gli editor come CodeMirror hanno bisogno di un "refresh" dopo un ridimensionamento programmatico
    // Potrebbe esserci una funzione esposta dal componente faust-editor o dall'istanza dell'editor
    // Esempio ipotetico (verifica la documentazione di faust-editor):
    // if (faustEditorElement.editor && typeof faustEditorElement.editor.refresh === 'function') {
    //   setTimeout(() => faustEditorElement.editor.refresh(), 0);
    // }
  } else {
    console.warn('faust-editor o il suo shadowRoot non trovati.');
  }
});