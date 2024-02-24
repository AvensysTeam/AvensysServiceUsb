import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {Alert } from 'react-native';

export const extractAndShareReportPDF = async (logText) => {
    
        const logLines = logText.split('\n');
        let reportText = '';
        let startReportFound = false;
        for (let i = 0; i < logLines.length; i++) {
            if (logLines[i].includes('<START_REPORT>')) {
                startReportFound = true;
                reportText = '';
            } else if (logLines[i].includes('<END_REPORT>')) {
                if (!startReportFound) {
                    Alert.alert('Error', 'Start tag <START_REPORT> not found before end tag <END_REPORT>');
                    return;
                }
                startReportFound = false;
            } else if (startReportFound) {
                reportText += logLines[i] + '\n';
            }
        }
        if (reportText.trim() === '') {
            Alert.alert('Error', 'No data found between start and end tags');
            return;
        }

        const options = {
            html: `
                <html>
                    <body>
                        <img src="file:///./img/logo_av.jpg" style="position: absolute; top: 0; left: 0; width: 50px;" />
                        <pre>${reportText}</pre>
                    </body>
                </html>`,
            fileName: 'report',
            directory: 'Documents',
        };
        try {
            const pdf = await RNHTMLtoPDF.convert(options);
            const totalPages = pdf.numberOfPages;
            for (let i = 0; i < totalPages; i++) {
                const currentPage = i + 1;
                const footerText = `${currentPage}/${totalPages}`;
                const pageNumberHtml = `<div style="position: absolute; bottom: 0; right: 0;">${footerText}</div>`;
                const pageFilePath = pdf.filePath.replace('.pdf', `_page_${currentPage}.pdf`);
                await RNHTMLtoPDF.convert({
                    html: pageNumberHtml,
                    fileName: `page_${currentPage}`,
                    filePath: pageFilePath,
                });
            }
            Share.open({
                url: `file://${pdf.filePath}`,
                title: 'Share PDF',
            });
        } catch (error) {
            console.error('Error sharing PDF:', error);
        }
    
};

export const extractAndShareFullPDF = async (logText) => {
    const logLines = logText.split('\n');
    let fullText = '';
    for (let i = 0; i < logLines.length; i++) {
        const timestamp = logLines[i].split(':')[0];
        const logEntry = logLines[i].substring(timestamp.length + 2); // +2 for the colon and space after timestamp
        fullText += logEntry + '\n';
    }

    const options = {
        html: `
            <html>
                <body>
                    <img src="file:///./img/logo_av.jpg" style="position: absolute; top: 10; left: 10; width: 50px;" />
                    <pre>${fullText}</pre>
                </body>
            </html>`,
        fileName: 'full_log',
        directory: 'Documents',
    };
    try {
        const pdf = await RNHTMLtoPDF.convert(options);
        const totalPages = pdf.numberOfPages;
        for (let i = 0; i < totalPages; i++) {
            const currentPage = i + 1;
            const footerText = `${currentPage}/${totalPages}`;
            const pageNumberHtml = `<div style="position: absolute; bottom: 0; right: 0;">${footerText}</div>`;
            const pageFilePath = pdf.filePath.replace('.pdf', `_page_${currentPage}.pdf`);
            await RNHTMLtoPDF.convert({
                html: pageNumberHtml,
                fileName: `page_${currentPage}`,
                filePath: pageFilePath,
            });
        }
        Share.open({
            url: `file://${pdf.filePath}`,
            title: 'Share PDF',
        });
    } catch (error) {
        console.error('Error sharing PDF:', error);
    }
};