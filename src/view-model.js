export function componentInlineStyle(component = {}) {
  return {
    fontSize: Number.isFinite(Number(component.fontSize)) ? `${Number(component.fontSize)}px` : '',
    color: typeof component.color === 'string' ? component.color : '',
    textAlign: typeof component.align === 'string' ? component.align : '',
  };
}

export function buildStageSvg(markup, cssText, width, height) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const safeCss = String(cssText ?? '').replace(/]]>/g, ']]]]><![CDATA[>');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${safeWidth}px;height:${safeHeight}px;overflow:hidden">
      <style><![CDATA[${safeCss}]]></style>
      ${String(markup ?? '')}
    </div>
  </foreignObject>
</svg>`;
}
