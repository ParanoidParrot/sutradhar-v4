import React, { useEffect, useRef } from 'react';
import { Platform, ScrollView } from 'react-native';

export default function WebScrollView({ children, style, contentContainerStyle, innerRef, webRef, onContentSizeChange, scrollToBottom }) {
  const divRef = useRef();

  // Expose div ref via webRef callback
  const setRef = (el) => {
    divRef.current = el;
    if (webRef) webRef.current = el;
  };

  // Auto scroll to bottom whenever children change
  useEffect(() => {
    if (Platform.OS === 'web' && divRef.current) {
      divRef.current.scrollTop = divRef.current.scrollHeight;
    }
  });

  if (Platform.OS === 'web') {
    return (
      <div
        ref={setRef}
        style={{
          flex: 1,
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <ScrollView
      ref={innerRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      onContentSizeChange={onContentSizeChange}
    >
      {children}
    </ScrollView>
  );
}