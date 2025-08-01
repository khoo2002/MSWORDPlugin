/**
 * MarkdownRenderer - Simple Markdown to HTML converter for chat messages
 * Supports basic formatting for clean, structured chat responses
 */
class MarkdownRenderer {
    /**
     * Convert Markdown text to HTML
     * @param {string} markdown - Markdown formatted text
     * @returns {string} HTML formatted text
     */
    static render(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return markdown || '';
        }

        let html = markdown;

        // Convert line breaks to <br> first (preserve paragraph structure)
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';

        // **Bold text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // *Italic text*
        html = html.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

        // `Code snippets`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bullet points with - or *
        html = html.replace(/^[\s]*[-\*]\s+(.+)$/gm, '<li>$1</li>');
        
        // Wrap consecutive list items in <ul>
        html = html.replace(/(<li>.*<\/li>)(\s*<li>.*<\/li>)*/gs, '<ul>$&</ul>');

        // Numbered lists
        html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)(\s*<li>.*<\/li>)*(?=<ul>)/gs, '<ol>$&</ol>');

        // Headers (## Header)
        html = html.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Blockquotes
        html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>\s*<\/p>/g, '');

        // Fix nested lists
        html = html.replace(/<\/ul>\s*<ul>/g, '');
        html = html.replace(/<\/ol>\s*<ol>/g, '');

        return html;
    }

    /**
     * Escape HTML to prevent XSS (for user input)
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render markdown with XSS protection for user content
     * @param {string} markdown - Markdown text
     * @param {boolean} trusted - Whether content is trusted (from AI) or needs escaping (from user)
     * @returns {string} Safe HTML
     */
    static renderSafe(markdown, trusted = false) {
        if (!trusted) {
            // Escape user input first
            markdown = this.escapeHtml(markdown);
        }
        
        return this.render(markdown);
    }
}
