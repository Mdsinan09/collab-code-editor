import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';

// Data URL worker to avoid cross-origin CDN Script error
window.MonacoEnvironment = {
  getWorker: function (_workerId, label) {
    return new Worker(
      'data:text/javascript;charset=utf-8,' +
        encodeURIComponent(`
          self.MonacoEnvironment = {
            baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/'
          };
          importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/base/worker/workerMain.js');
        `),
      { name: label }
    );
  },
};

loader.config({ monaco });

// Preset color palette for users
const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#10b981', '#0ea5e9', '#a855f7',
];

function getUserColor(clientId) {
  return USER_COLORS[clientId % USER_COLORS.length];
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function injectCursorStyle(clientId, color) {
  const id = `cursor-style-${clientId}`;
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .remote-cursor-${clientId} { border-left: 2px solid ${color} !important; margin-left: -1px; }
    .remote-selection-${clientId} { background-color: ${color}26 !important; }
  `;
  document.head.appendChild(style);
}

function removeCursorStyle(clientId) {
  const el = document.getElementById(`cursor-style-${clientId}`);
  if (el) el.remove();
}

const Editor = forwardRef(({ ydoc, activeFileId, provider, username, onUsersChange }, ref) => {
  const [editorInstance, setEditorInstance] = useState(null);
  const bindingRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef({});
  const widgetsRef = useRef({});
  const userColorRef = useRef(stringToColor(username || 'Anonymous'));
  const onUsersChangeRef = useRef(onUsersChange);

  useEffect(() => {
    onUsersChangeRef.current = onUsersChange;
  }, [onUsersChange]);

  useImperativeHandle(ref, () => ({
    getValue: () => editorInstance?.getValue() || '',
    setValue: (value) => editorInstance?.setValue(value),
    getEditor: () => editorInstance,
  }), [editorInstance]);

  // Bind to active file's Y.Text
  useEffect(() => {
    if (!editorInstance || !ydoc || !activeFileId || !provider) return;

    const filesMap = ydoc.getMap('files');
    const fileMap = filesMap.get(activeFileId);
    if (!fileMap) return;

    const ytext = fileMap.get('content');
    if (!ytext) return;

    const binding = new MonacoBinding(
      ytext,
      editorInstance.getModel(),
      new Set([editorInstance])
    );
    bindingRef.current = binding;

    // Set language from file
    const language = fileMap.get('language');
    if (monacoRef.current && language) {
      monacoRef.current.editor.setModelLanguage(editorInstance.getModel(), language);
    }

    return () => {
      binding.destroy();
      bindingRef.current = null;
    };
  }, [editorInstance, ydoc, activeFileId, provider]);

  // Track cursor position
  useEffect(() => {
    if (!editorInstance || !provider) return;

    const disposable = editorInstance.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      provider.awareness.setLocalStateField('cursor', {
        line: sel.positionLineNumber,
        column: sel.positionColumn,
        selectionStartLineNumber: sel.selectionStartLineNumber,
        selectionStartColumn: sel.selectionStartColumn,
        endLineNumber: sel.endLineNumber,
        endColumn: sel.endColumn,
      });
    });

    return () => disposable.dispose();
  }, [editorInstance, provider]);

  // Render remote cursors safely with requestAnimationFrame
  useEffect(() => {
    if (!editorInstance || !provider || !monacoRef.current) return;

    const monacoInstance = monacoRef.current;

    const renderRemoteCursors = () => {
      if (!editorInstance) return;

      const states = Array.from(provider.awareness.getStates().entries());
      const localClientId = provider.awareness.clientID;

      const allUsers = states.map(([clientId, state]) => ({
        clientId,
        name: state?.user?.name || 'Anonymous',
        color: state?.user?.color || getUserColor(clientId),
        cursor: state?.cursor || null,
        isMe: clientId === localClientId,
      }));

      if (onUsersChangeRef.current) {
        onUsersChangeRef.current(allUsers);
      }

      const activeRemoteIds = new Set(
        states.filter(([id]) => id !== localClientId).map(([id]) => id)
      );

      // Cleanup left users
      Object.keys(widgetsRef.current).forEach((clientIdStr) => {
        const cid = parseInt(clientIdStr);
        if (!activeRemoteIds.has(cid)) {
          try { editorInstance.removeContentWidget(widgetsRef.current[clientIdStr]); } catch (e) {}
          delete widgetsRef.current[clientIdStr];
        }
      });

      Object.keys(decorationsRef.current).forEach((clientIdStr) => {
        const cid = parseInt(clientIdStr);
        if (!activeRemoteIds.has(cid)) {
          try { editorInstance.deltaDecorations(decorationsRef.current[clientIdStr], []); } catch (e) {}
          delete decorationsRef.current[clientIdStr];
          removeCursorStyle(cid);
        }
      });

      // Render each remote cursor
      states.forEach(([clientId, state]) => {
        if (clientId === localClientId) return;
        if (!state || !state.cursor) return;

        const color = state.user?.color || getUserColor(clientId);
        const name = state.user?.name || 'Anonymous';
        const cursor = state.cursor;

        injectCursorStyle(clientId, color);

        const newDecorations = [];

        newDecorations.push({
          range: new monacoInstance.Range(cursor.line, cursor.column, cursor.line, cursor.column),
          options: {
            className: `remote-cursor-${clientId}`,
            overviewRuler: { color, position: monacoInstance.editor.OverviewRulerLane.Full },
          },
        });

        const hasSelection = cursor.selectionStartLineNumber !== cursor.endLineNumber ||
          cursor.selectionStartColumn !== cursor.endColumn;

        if (hasSelection) {
          newDecorations.push({
            range: new monacoInstance.Range(
              cursor.selectionStartLineNumber,
              cursor.selectionStartColumn,
              cursor.endLineNumber,
              cursor.endColumn
            ),
            options: {
              className: `remote-selection-${clientId}`,
              overviewRuler: { color: color + '40', position: monacoInstance.editor.OverviewRulerLane.Full },
            },
          });
        }

        const oldDecorations = decorationsRef.current[clientId] || [];
        decorationsRef.current[clientId] = editorInstance.deltaDecorations(oldDecorations, newDecorations);

        const widgetId = `cursor-label-${clientId}`;
        if (widgetsRef.current[clientId]) {
          try { editorInstance.removeContentWidget(widgetsRef.current[clientId]); } catch (e) {}
        }

        const widget = {
          getId: () => widgetId,
          getDomNode: () => {
            const el = document.createElement('div');
            el.style.cssText = `
              background-color: ${color}; color: white; padding: 2px 6px;
              border-radius: 3px 3px 3px 0; font-size: 11px;
              font-family: ui-sans-serif, system-ui, sans-serif;
              font-weight: 600; white-space: nowrap; pointer-events: none;
              position: relative; top: -20px; left: -2px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 100; line-height: 1.2;
            `;
            el.textContent = name;
            return el;
          },
          getPosition: () => ({
            position: new monacoInstance.Position(cursor.line, cursor.column),
            preference: [monacoInstance.editor.ContentWidgetPositionPreference.EXACT],
          }),
        };

        editorInstance.addContentWidget(widget);
        widgetsRef.current[clientId] = widget;
      });
    };

    let rafId = null;
    const scheduleRenderRemoteCursors = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        renderRemoteCursors();
      });
    };

    provider.awareness.on('change', scheduleRenderRemoteCursors);
    scheduleRenderRemoteCursors();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      provider.awareness.off('change', scheduleRenderRemoteCursors);
      Object.values(decorationsRef.current).forEach((decs) => {
        try { editorInstance.deltaDecorations(decs, []); } catch (e) {}
      });
      decorationsRef.current = {};
      Object.values(widgetsRef.current).forEach((widget) => {
        try { editorInstance.removeContentWidget(widget); } catch (e) {}
      });
      widgetsRef.current = {};
      for (let i = 0; i < 200; i++) removeCursorStyle(i);
    };
  }, [editorInstance, provider]);

  // Update username in awareness
  useEffect(() => {
    if (provider) {
      const currentState = provider.awareness.getLocalState() || {};
      provider.awareness.setLocalState({
        ...currentState,
        user: { name: username, color: userColorRef.current },
      });
    }
  }, [username, provider]);

  const handleEditorDidMount = (editor, monacoInstance) => {
    setEditorInstance(editor);
    monacoRef.current = monacoInstance;
  };

  return (
    <div className="w-full h-full relative">
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
});

export default Editor;
