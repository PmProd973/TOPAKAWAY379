// Créez un fichier utils/exportFunctions.js ou complétez-le s'il existe déjà
export const generatePartsList = (sceneObjects, materials) => {
    // Formatter les pièces pour affichage et export
    const formattedPieces = sceneObjects.map(obj => {
      if (obj.type !== 'piece' || !obj.piece) return null;
      
      // Trouver le matériau correspondant
      const material = materials.find(m => m.id === obj.piece.materialId);
      
      return {
        description: obj.piece.description || 'Sans description',
        width: obj.piece.width,
        length: obj.piece.length,
        thickness: obj.piece.thickness,
        material: material ? material.name : 'Inconnu',
        volume: (obj.piece.width * obj.piece.length * obj.piece.thickness) / 1000000 // en dm³
      };
    }).filter(p => p !== null);
    
    // Générer un HTML pour l'impression
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des pièces</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .logo { max-height: 60px; }
          .title { font-size: 24px; font-weight: bold; }
          .info { margin-top: 20px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Liste des pièces</div>
          <div class="date">Date: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="info">
          <p>Total: ${formattedPieces.length} pièces</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Largeur (mm)</th>
              <th>Longueur (mm)</th>
              <th>Épaisseur (mm)</th>
              <th>Matériau</th>
              <th>Volume (dm³)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    formattedPieces.forEach(piece => {
      html += `
        <tr>
          <td>${piece.description}</td>
          <td>${piece.width}</td>
          <td>${piece.length}</td>
          <td>${piece.thickness}</td>
          <td>${piece.material}</td>
          <td>${piece.volume.toFixed(3)}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
        
        <button onclick="window.print()">Imprimer</button>
      </body>
      </html>
    `;
    
    return html;
  };
  
  // Fonction pour ouvrir la liste dans une nouvelle fenêtre
  export const openPartsList = (sceneObjects, materials) => {
    const html = generatePartsList(sceneObjects, materials);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
  };