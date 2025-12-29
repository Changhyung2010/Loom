import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './MindMapView.css';

const COLORS = {
  bgBase: '#000000',
  bgSurface: '#0a0a0a',
  bgElevated: '#141414',
  bgHover: '#1a1a1a',
  bgContainer: '#141414',
  bgMain: '#000000',
  bgInput: '#1a1a1a',
  textPrimary: '#ffffff',
  textSecondary: '#b3b3b3',
  textMuted: '#808080',
  accent: '#ffffff',
  accentHover: '#e0e0e0',
  border: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  codeText: '#b3b3b3',
  purple: '#ffffff',
  green: '#ffffff',
  yellow: '#ffffff',
};

// Clean node style
const baseNodeStyle = {
  borderRadius: '12px',
  color: COLORS.textPrimary,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  textAlign: 'center',
};

// Edge style - cleaner curved lines
const baseEdgeStyle = {
  strokeWidth: 2,
  strokeOpacity: 0.7,
};

function parseProjectStructureToNodes(explanation) {
  // Extract project structure JSON from explanation
  const structureMatch = explanation.match(/<!--PROJECT_STRUCTURE_START-->\s*\n(.*?)\n\s*<!--PROJECT_STRUCTURE_END-->/s);
  if (!structureMatch) return null;
  
  try {
    const projectData = JSON.parse(structureMatch[1]);
    const nodes = [];
    const edges = [];
    const fileNodes = {};
    
    const files = projectData.files || [];
    if (files.length === 0) return null;
    
    // Extract project name from project_path
    let projectName = 'Project';
    if (projectData.project_path) {
      const pathParts = projectData.project_path.split(/[/\\]/).filter(p => p);
      projectName = pathParts[pathParts.length - 1] || 'Project';
    }
    
    // Group files by their directory path
    const filesByDir = {};
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(p => p);
      const fileName = pathParts.pop();
      const dirPath = pathParts.join('/') || 'root';
      if (!filesByDir[dirPath]) filesByDir[dirPath] = [];
      filesByDir[dirPath].push({ ...file, fileName });
    });
    
    // Get all unique directory paths (including nested parent paths)
    const allDirPaths = new Set(['root']);
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(p => p);
      pathParts.pop(); // Remove filename
      // Add all parent directory paths
      for (let i = 0; i < pathParts.length; i++) {
        allDirPaths.add(pathParts.slice(0, i + 1).join('/'));
      }
    });
    
    // Sort directories by depth (shallow first) then alphabetically
    const sortedDirPaths = Array.from(allDirPaths).sort((a, b) => {
      const depthA = a === 'root' ? 0 : a.split('/').length;
      const depthB = b === 'root' ? 0 : b.split('/').length;
      if (depthA !== depthB) return depthA - depthB;
      return a.localeCompare(b);
    });
    
    // Create root node (project name)
    const centerX = 800;
    const rootY = 50;
    nodes.push({
      id: 'root',
      type: 'default',
      position: { x: centerX - 100, y: rootY },
      data: { 
        label: `📁 ${projectName}`,
        fullText: `Project: ${projectName}\n\nContains ${files.length} code files across ${sortedDirPaths.length} directories.`
      },
      style: {
        ...baseNodeStyle,
        background: COLORS.bgElevated,
        border: `3px solid ${COLORS.accent}`,
        color: COLORS.textPrimary,
        fontSize: '20px',
        fontWeight: '700',
        padding: '24px 36px',
        width: 220,
      },
    });
    
    // Layout parameters - balanced spacing to prevent overlaps
    const dirYSpacing = 200; // Vertical spacing between directory levels
    const fileYSpacing = 80; // Vertical spacing for files under directories
    const fileXSpacing = 180; // Horizontal spacing between files
    const dirXSpacing = 320; // Horizontal spacing between directories at same level
    
    // Track directory node positions for layout
    const dirNodePositions = { root: { x: centerX, y: rootY + 100 } };
    const dirNodes = { root: 'root' };
    
    // Create directory nodes level by level
    sortedDirPaths.forEach((dirPath, dirIndex) => {
      if (dirPath === 'root') return; // Already handled
      
      const pathParts = dirPath.split('/');
      const dirName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join('/') || 'root';
      const parentNodeId = dirNodes[parentPath];
      
      if (!parentNodeId) return;
      
      const dirFiles = filesByDir[dirPath] || [];
      const siblingDirs = sortedDirPaths.filter(p => {
        const pParts = p.split('/');
        const pParent = pParts.slice(0, -1).join('/') || 'root';
        return pParent === parentPath && p !== dirPath;
      });
      const siblingIndex = siblingDirs.indexOf(dirPath);
      
      // Calculate position based on parent and siblings
      const parentPos = dirNodePositions[parentPath];
      const level = pathParts.length;
      const baseY = parentPos.y + dirYSpacing;
      const siblingsCount = siblingDirs.length;
      const totalWidth = (siblingsCount - 1) * dirXSpacing;
      const startX = parentPos.x - totalWidth / 2;
      const dirX = siblingsCount > 1 ? startX + siblingIndex * dirXSpacing : parentPos.x;
      const dirY = baseY;
      
      const dirNodeId = `dir-${dirIndex}`;
      dirNodes[dirPath] = dirNodeId;
      dirNodePositions[dirPath] = { x: dirX, y: dirY };
      
      nodes.push({
        id: dirNodeId,
        type: 'default',
        position: { x: dirX - 80, y: dirY },
        data: { 
          label: `📂 ${dirName}`,
          fullText: `Directory: ${dirPath}\n\n${dirFiles.length} files`
        },
        style: {
          ...baseNodeStyle,
          background: COLORS.bgElevated,
          border: `2px solid ${COLORS.textSecondary}`,
          color: COLORS.textPrimary,
          fontSize: '14px',
          fontWeight: '600',
          padding: '12px 18px',
          width: 160,
        },
      });
      
      // Connect directory to parent
      edges.push({
        id: `edge-${parentNodeId}-${dirNodeId}`,
        source: parentNodeId,
        target: dirNodeId,
        type: 'smoothstep',
        style: {
          ...baseEdgeStyle,
          stroke: COLORS.textSecondary,
          strokeWidth: 2,
        },
      });
      
      // Add files under this directory - better centered layout
      dirFiles.forEach((file, fileIndex) => {
        const fileName = file.fileName;
        const fileNodeId = `file-${dirIndex}-${fileIndex}`;
        const filesPerRow = 4; // Allow more files per row with better spacing
        const filesInRow = Math.min(filesPerRow, dirFiles.length - Math.floor(fileIndex / filesPerRow) * filesPerRow);
        const rowStartIndex = Math.floor(fileIndex / filesPerRow) * filesPerRow;
        const rowWidth = (filesInRow - 1) * fileXSpacing;
        const fileX = dirX - (rowWidth / 2) + (fileIndex % filesPerRow) * fileXSpacing - 70; // Center files under directory
        const fileY = dirY + fileYSpacing + Math.floor(fileIndex / filesPerRow) * fileYSpacing;
        
        fileNodes[file.path] = fileNodeId;
        nodes.push({
          id: fileNodeId,
          type: 'default',
          position: { x: fileX, y: fileY },
          data: { 
            label: fileName.length > 18 ? fileName.substring(0, 15) + '...' : fileName,
            fullTitle: fileName,
            fullText: `File: ${file.path}\n\nExtension: ${file.extension}\nImports: ${(file.imports || []).length}\nDependencies: ${(projectData.dependencies[file.path] || []).length}`,
            filePath: file.path, // Store file path for code extraction
            extension: file.extension,
            imports: file.imports || [],
            isFile: true
          },
          style: {
            ...baseNodeStyle,
            background: COLORS.bgElevated,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textSecondary,
            fontSize: '11px',
            fontWeight: '500',
            padding: '8px 12px',
            width: 140,
            fontFamily: '"SF Mono", "Monaco", monospace',
          },
        });
        
        // Connect file to directory
        edges.push({
          id: `edge-${dirNodeId}-${fileNodeId}`,
          source: dirNodeId,
          target: fileNodeId,
          type: 'smoothstep',
          style: {
            ...baseEdgeStyle,
            stroke: COLORS.border,
            strokeWidth: 1,
            strokeOpacity: 0.6,
          },
        });
      });
    });
    
    // Handle root level files (files with no directory path) - centered
    if (filesByDir['root']) {
      const rootFiles = filesByDir['root'];
      rootFiles.forEach((file, fileIndex) => {
        const fileName = file.fileName;
        const fileNodeId = `file-root-${fileIndex}`;
        const filesPerRow = 4; // Allow more files per row with better spacing
        const filesInRow = Math.min(filesPerRow, rootFiles.length - Math.floor(fileIndex / filesPerRow) * filesPerRow);
        const rowStartIndex = Math.floor(fileIndex / filesPerRow) * filesPerRow;
        const rowWidth = (filesInRow - 1) * fileXSpacing;
        const fileX = centerX - (rowWidth / 2) + (fileIndex % filesPerRow) * fileXSpacing - 70; // Center files under root
        const fileY = rootY + 120 + fileYSpacing + Math.floor(fileIndex / filesPerRow) * fileYSpacing;
        
        fileNodes[file.path] = fileNodeId;
        nodes.push({
          id: fileNodeId,
          type: 'default',
          position: { x: fileX, y: fileY },
          data: { 
            label: fileName.length > 18 ? fileName.substring(0, 15) + '...' : fileName,
            fullTitle: fileName,
            fullText: `File: ${file.path}\n\nExtension: ${file.extension}\nImports: ${(file.imports || []).length}\nDependencies: ${(projectData.dependencies[file.path] || []).length}`,
            filePath: file.path, // Store file path for code extraction
            extension: file.extension,
            imports: file.imports || [],
            isFile: true
          },
          style: {
            ...baseNodeStyle,
            background: COLORS.bgElevated,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textSecondary,
            fontSize: '11px',
            fontWeight: '500',
            padding: '8px 12px',
            width: 140,
            fontFamily: '"SF Mono", "Monaco", monospace',
          },
        });
        
        edges.push({
          id: `edge-root-${fileNodeId}`,
          source: 'root',
          target: fileNodeId,
          type: 'smoothstep',
          style: {
            ...baseEdgeStyle,
            stroke: COLORS.border,
            strokeWidth: 1,
            strokeOpacity: 0.6,
          },
        });
      });
    }
    
    // Add dependency edges between files (only for visible files)
    Object.entries(projectData.dependencies || {}).forEach(([filePath, deps]) => {
      const sourceNodeId = fileNodes[filePath];
      if (!sourceNodeId) return;
      
      deps.forEach(depPath => {
        const targetNodeId = fileNodes[depPath];
        if (targetNodeId && sourceNodeId !== targetNodeId) {
          edges.push({
            id: `dep-${sourceNodeId}-${targetNodeId}`,
            source: sourceNodeId,
            target: targetNodeId,
            type: 'smoothstep',
            style: {
              stroke: COLORS.accent,
              strokeWidth: 1.5,
              strokeOpacity: 0.3,
            },
            animated: false,
          });
        }
      });
    });
    
    return { nodes, edges };
  } catch (e) {
    console.error('Failed to parse project structure:', e);
    return null;
  }
}

function parseExplanationToNodes(explanation) {
  if (!explanation) return { nodes: [], edges: [] };

  // Check if this is a project structure
  const projectNodes = parseProjectStructureToNodes(explanation);
  if (projectNodes) return projectNodes;

  const nodes = [];
  const edges = [];

  // Extract main file/component name
  const mainTitleMatch = explanation.match(/^#\s+(.+?)$/m);
  let mainTitle = mainTitleMatch ? mainTitleMatch[1].trim() : 'Code Analysis';
  
  // Clean up title - remove markdown formatting
  mainTitle = mainTitle.replace(/[`*_]/g, '').trim();
  if (mainTitle.length > 25) mainTitle = mainTitle.substring(0, 25) + '...';

  // Extract full explanation text for root node
  const fullExplanationText = explanation;
  
  // Root node - centered at top
  const centerX = 500;
  nodes.push({
    id: 'root',
    type: 'default',
    position: { x: centerX - 125, y: 50 },
    data: { 
      label: `📄 ${mainTitle}`,
      fullText: fullExplanationText
    },
    style: {
      ...baseNodeStyle,
      background: COLORS.bgElevated,
      border: `2px solid ${COLORS.accent}`,
      color: COLORS.textPrimary,
      fontSize: '16px',
      fontWeight: '700',
      padding: '16px 24px',
      width: 250,
    },
  });

  // Extract H2 headings with their full content - limit to 6
  const h2Matches = [...explanation.matchAll(/^##\s+(.+?)$/gm)];
  const concepts = [];
  
  h2Matches.forEach((match, index) => {
    let conceptTitle = match[1].trim().replace(/[`*_]/g, '');
    if (conceptTitle && conceptTitle.length > 0 && concepts.length < 6) {
      // Extract the full section content
      const sectionStart = match.index + match[0].length;
      const nextMatch = h2Matches[index + 1];
      const sectionEnd = nextMatch ? nextMatch.index : explanation.length;
      const fullSectionText = explanation.substring(sectionStart, sectionEnd).trim();
      
      // Shorten concept title for display
      const displayTitle = conceptTitle.length > 20 ? conceptTitle.substring(0, 20) + '...' : conceptTitle;
      concepts.push({
        title: displayTitle,
        fullTitle: conceptTitle,
        fullText: fullSectionText || conceptTitle
      });
    }
  });

  // Position concepts in a clean horizontal layout below root
  const conceptY = 200;
  const conceptSpacing = 220;
  const totalWidth = (concepts.length - 1) * conceptSpacing;
  const startX = centerX - totalWidth / 2;

  // Color palette for concepts
  const conceptColors = [
    COLORS.accent,
    COLORS.purple,
    COLORS.codeText,
    COLORS.green,
    COLORS.yellow,
    COLORS.accentHover,
  ];

  concepts.forEach((concept, index) => {
    const nodeId = `concept-${index}`;
    const x = startX + index * conceptSpacing - 90;
    const color = conceptColors[index % conceptColors.length];

    nodes.push({
      id: nodeId,
      type: 'default',
      position: { x, y: conceptY },
      data: { 
        label: concept.title,
        fullText: concept.fullText,
        fullTitle: concept.fullTitle
      },
      style: {
        ...baseNodeStyle,
        background: COLORS.bgElevated,
        border: `2px solid ${color}`,
        color: COLORS.textPrimary,
        fontSize: '13px',
        fontWeight: '600',
        padding: '14px 18px',
        width: 180,
      },
    });

    // Connect to root with curved edge
    edges.push({
      id: `edge-root-${nodeId}`,
      source: 'root',
      target: nodeId,
      type: 'smoothstep',
      style: {
        ...baseEdgeStyle,
        stroke: color,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: color,
        width: 15,
        height: 15,
      },
    });
  });

  // Extract key terms/functions mentioned (limit to 4 per concept)
  const codeTerms = [...explanation.matchAll(/`([A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?)`/g)];
  const uniqueTerms = [];
  
  codeTerms.forEach((match) => {
    const term = match[1].trim();
    if (term && term.length > 2 && term.length < 30 && !uniqueTerms.includes(term) && uniqueTerms.length < 12) {
      uniqueTerms.push(term);
    }
  });

  // Position code terms below their parent concepts
  if (uniqueTerms.length > 0 && concepts.length > 0) {
    const termsPerConcept = Math.ceil(uniqueTerms.length / concepts.length);
    
    uniqueTerms.forEach((term, index) => {
      const conceptIndex = Math.floor(index / termsPerConcept) % concepts.length;
      const localIndex = index % termsPerConcept;
      const parentNodeId = `concept-${conceptIndex}`;
      const termNodeId = `term-${index}`;
      
      const parentNode = nodes.find((n) => n.id === parentNodeId);
      if (parentNode) {
        const offsetX = (localIndex - (termsPerConcept - 1) / 2) * 140;
        const x = parentNode.position.x + 90 + offsetX - 60;
        const y = conceptY + 130 + Math.floor(index / concepts.length) * 80;

        nodes.push({
          id: termNodeId,
          type: 'default',
          position: { x, y },
          data: { 
            label: term.length > 18 ? term.substring(0, 18) + '...' : term,
            fullText: term
          },
          style: {
            ...baseNodeStyle,
            background: COLORS.bgElevated,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textSecondary,
            fontSize: '11px',
            fontWeight: '500',
            padding: '8px 12px',
            width: 120,
            fontFamily: '"SF Mono", "Monaco", monospace',
          },
        });

        edges.push({
          id: `edge-${parentNodeId}-${termNodeId}`,
          source: parentNodeId,
          target: termNodeId,
          type: 'smoothstep',
          style: {
            ...baseEdgeStyle,
            stroke: COLORS.textSecondary,
            strokeWidth: 1,
            strokeOpacity: 0.5,
          },
        });
      }
    });
  }

  return { nodes, edges };
}

function MindMapView({ explanation }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => parseExplanationToNodes(explanation),
    [explanation]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [fullscreenNode, setFullscreenNode] = useState(null);
  
  // Extract file code and description from explanation
  const extractFileCode = useCallback((filePath) => {
    if (!explanation) return { code: null, description: null };
    
    // Find the file section in the explanation
    // Format: ## File: `path/to/file`
    const escapedPath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fileSectionRegex = new RegExp(`## File: \\\`${escapedPath}\\\`\\s*\\n\\n([\\s\\S]*?)(?=## File:|$)`, 'i');
    const match = explanation.match(fileSectionRegex);
    
    if (match) {
      const sectionContent = match[1];
      // Extract code block (between ``` markers)
      const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)```/;
      const codeMatch = sectionContent.match(codeBlockRegex);
      
      // Extract description that comes after the code block
      // Look for "### Description of" or similar patterns, or text after code block
      const codeBlockEnd = codeMatch ? codeMatch.index + codeMatch[0].length : 0;
      const textAfterCode = sectionContent.substring(codeBlockEnd);
      
      // Try to find "### Description of" header
      const descHeaderRegex = /###\s*Description\s+of[^\n]*:?\s*\n\s*([\s\S]*?)(?=\n###|$)/i;
      const descHeaderMatch = textAfterCode.match(descHeaderRegex);
      
      // If no header, look for paragraph after code block (skip metadata lines)
      let description = null;
      if (descHeaderMatch) {
        description = descHeaderMatch[1].trim();
      } else if (textAfterCode) {
        // Extract meaningful text after code block (skip empty lines and metadata)
        const cleanText = textAfterCode.replace(/^\s*\*\*[^*]+\*\*:?\s*[^\n]*\n/gm, '').trim();
        if (cleanText.length > 50) {
          description = cleanText.split('\n\n')[0].trim(); // Take first paragraph
        }
      }
      
      const code = codeMatch ? codeMatch[1].trim() : null;
      
      // If we found description in the file section, return it
      if (description) {
        return { code, description };
      }
    }
    
    // Fallback: Try to find file description in the main analysis text
    // Look for the file name mentioned in the explanation with context
    const fileName = filePath.split('/').pop();
    const fileNameBase = fileName.replace(/\.[^.]+$/, ''); // Remove extension
    
    // Look for patterns like "FileName.java" or "FileName" followed by description
    const patterns = [
      // Pattern 1: File name in backticks or code format
      new RegExp(`\`[^\`]*${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\`]*\`[^\\n]*:?\\s*([^\\n]{50,500})`, 'i'),
      // Pattern 2: File name mentioned naturally
      new RegExp(`\\b${fileNameBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^\\n]*:?\\s*([^\\n]{50,500})`, 'i'),
      // Pattern 3: Full path mentioned
      new RegExp(filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\n]*:?\\s*([^\\n]{50,500})', 'i'),
    ];
    
    for (const pattern of patterns) {
      const descMatch = explanation.match(pattern);
      if (descMatch && descMatch[1]) {
        const desc = descMatch[1].trim();
        // Clean up the description (remove markdown, limit length)
        const cleanDesc = desc.replace(/\*\*/g, '').replace(/`/g, '').substring(0, 800);
        if (cleanDesc.length > 50) {
          return { code: null, description: cleanDesc };
        }
      }
    }
    
    return { code: null, description: null };
  }, [explanation]);

  // Update nodes and edges when explanation changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = parseExplanationToNodes(explanation);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [explanation, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => [
        ...eds,
        {
          ...params,
          type: 'smoothstep',
          style: baseEdgeStyle,
        },
      ]);
    },
    [setEdges]
  );

  const onNodeDoubleClick = useCallback((event, node) => {
    if (node.data) {
      let displayText = node.data.fullText || node.data.label;
      let title = node.data.fullTitle || node.data.label;
      
      // If it's a file node, try to extract the actual code and description
      if (node.data.isFile && node.data.filePath) {
        const fileData = extractFileCode(node.data.filePath);
        if (fileData.code || fileData.description) {
          let textParts = [`File: ${node.data.filePath}`, `Extension: ${node.data.extension || 'unknown'}`, `Imports: ${(node.data.imports || []).length}`];
          
          if (fileData.description) {
            textParts.push(`\nDescription:\n${fileData.description}`);
          }
          
          if (fileData.code) {
            textParts.push(`\n\nCode:\n\n\`\`\`\n${fileData.code}\n\`\`\``);
          }
          
          displayText = textParts.join('\n');
          title = node.data.filePath;
        }
      }
      
      if (displayText) {
        setFullscreenNode({
          title: title,
          text: displayText
        });
      }
    }
  }, [explanation, extractFileCode]);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenNode(null);
  }, []);

  if (!explanation || initialNodes.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.textSecondary,
          fontSize: '14px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div>Visual diagram will appear here</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: COLORS.textSecondary }}>
            Generate an explanation to see the interactive mind map
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: COLORS.bgMain, 
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      zIndex: 0
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1.5, minZoom: 0.3 }}
        style={{ background: COLORS.bgMain }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: baseEdgeStyle,
        }}
      >
        <Background color={COLORS.borderSubtle} gap={24} size={1} variant="dots" />
        <Controls
          style={{
            button: {
              backgroundColor: COLORS.bgContainer,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
            },
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === 'root') return COLORS.accent;
            if (node.id.startsWith('concept-')) return COLORS.accentHover;
            return COLORS.textSecondary;
          }}
          maskColor={`${COLORS.bgMain}DD`}
          style={{
            backgroundColor: COLORS.bgContainer,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
          }}
          pannable
          zoomable
        />
      </ReactFlow>
      
      {/* Fullscreen Modal */}
      {fullscreenNode && (
        <div
          onClick={handleCloseFullscreen}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            animation: 'fadeIn 0.3s ease',
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              backgroundColor: COLORS.bgElevated,
              border: `1px solid ${COLORS.borderDefault}`,
              borderRadius: '16px',
              padding: '32px',
              overflow: 'auto',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)',
              animation: 'slideUp 0.3s ease',
              cursor: 'default'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${COLORS.borderSubtle}`
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: COLORS.textPrimary,
                margin: 0
              }}>
                {fullscreenNode.title}
              </h2>
              <button
                onClick={handleCloseFullscreen}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${COLORS.borderDefault}`,
                  borderRadius: '6px',
                  color: COLORS.textSecondary,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgHover;
                  e.currentTarget.style.color = COLORS.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = COLORS.textSecondary;
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>
            <div style={{
              color: COLORS.textPrimary,
              fontSize: '14px',
              lineHeight: '1.7',
              wordBreak: 'break-word'
            }}>
              {fullscreenNode.text && fullscreenNode.text.includes('```') ? (
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: '"SF Mono", "Monaco", monospace' }}>
                  {fullscreenNode.text.split('```').map((part, idx) => {
                    if (idx % 2 === 0) {
                      return <span key={idx}>{part}</span>;
                    }
                    return (
                      <pre key={idx} style={{
                        backgroundColor: COLORS.bgMain,
                        padding: '12px',
                        borderRadius: '6px',
                        overflow: 'auto',
                        border: `1px solid ${COLORS.borderSubtle}`,
                        margin: '12px 0',
                        fontSize: '13px',
                        lineHeight: '1.6'
                      }}>
                        <code>{part.trim()}</code>
                      </pre>
                    );
                  })}
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {fullscreenNode.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MindMapView;
