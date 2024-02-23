import React, { useEffect, useState, useRef } from 'react';
import { DeviceEventEmitter, ScrollView, Text, View, Button, TextInput, Alert } from 'react-native';
import { RNSerialport, definitions, actions } from 'react-native-usb-serialport';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const App = () => {
    const [logText, setLogText] = useState('');
    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef();
    const [connectedDevice, setConnectedDevice] = useState(null);
    let tempLog = '';

    useEffect(() => {
        const appendLog = (text) => {
            setLogText(prevLog => prevLog + text + '\n');
        };

        const startListeners = () => {
            const eventListeners = [
                { action: actions.ON_SERVICE_STARTED, message: 'Service started' },
                { action: actions.ON_SERVICE_STOPPED, message: 'Service stopped' },
                { action: actions.ON_DEVICE_ATTACHED, message: 'Device Attached' },
                { action: actions.ON_DEVICE_DETACHED, message: 'Device Detached' },
                { action: actions.ON_ERROR, message: 'Error' },
                { action: actions.ON_CONNECTED, handler: connectToDevice },
                { action: actions.ON_DISCONNECTED, message: 'Disconnected' },
                { action: actions.ON_READ_DATA, handler: handleReadData }
            ];
            eventListeners.forEach(listener => {
                DeviceEventEmitter.addListener(listener.action, (data) => {
                    if (listener.handler) {
                        listener.handler(data);
                    } else {
                        appendLog(listener.message);
                    }
                });
            });

            RNSerialport.setInterface(-1);
            RNSerialport.setReturnedDataType(definitions.RETURNED_DATA_TYPES.INTARRAY);
            RNSerialport.setFlowControl(definitions.FLOW_CONTROLS.FLOW_CONTROL_OFF);
            RNSerialport.setDataBit(definitions.DATA_BITS.DATA_BITS_8);
            RNSerialport.setParity(definitions.PARITIES.PARITY_NONE);
            RNSerialport.setDriver(definitions.DRIVER_TYPES.FTDI);
            RNSerialport.setAutoConnectBaudRate(9600);
            RNSerialport.setAutoConnect(true);
            RNSerialport.startUsbService();
        };

        const connectToDevice = () => {
            RNSerialport.getDeviceList()
                .then(devices => {
                    if (devices.length > 0) {
                        setConnectedDevice(devices[0]);
                    } else {
                        setConnectedDevice(null);
                    }
                })
                .catch(error => {
                    console.error('Error getting list of devices:', error);
                    setConnectedDevice(null);
                });
        };

        const handleReadData = (data) => {
            const charString = String.fromCharCode.apply(null, data.payload);
            const newlineIndex = charString.indexOf('\n');
            if (newlineIndex !== -1) {
                tempLog += charString.substring(0, newlineIndex + 1);
                const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(2);
                const logEntry = `${timestamp}: ${tempLog}`;
                appendLog(logEntry);
                tempLog = '';
                const remainingChars = charString.substring(newlineIndex + 1);
                if (remainingChars.length > 0) {
                    tempLog += remainingChars;
                }
            } else {
                tempLog += charString;
            }
        };

        startListeners();

        return () => {
            DeviceEventEmitter.removeAllListeners();
            RNSerialport.isOpen((isOpen) => {
                if (isOpen) {
                    RNSerialport.disconnect();
                    RNSerialport.stopUsbService();
                } else {
                    RNSerialport.stopUsbService();
                }
            });
        };
    }, []);

    useEffect(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
    }, [logText]);

    useEffect(() => {
        if (connectedDevice) {
            setLogText(prevLog => prevLog + 'Connected Devices:\n');
            setLogText(prevLog => prevLog + `- ${connectedDevice.name}\n`);
            setLogText(prevLog => prevLog + `- ${connectedDevice.vendorId}\n`);
            setLogText(prevLog => prevLog + `- ${connectedDevice.productId}\n`);
            setLogText(prevLog => prevLog + 'Waiting for data...\n');
        } else {
            setLogText(prevLog => prevLog + 'No connected devices found.\n');
        }
    }, [connectedDevice]);

    const handleClearLog = () => {
        setLogText('');
    };

    const handleSendData = (data = inputText) => {
        if (connectedDevice) {
            try {
                RNSerialport.writeString(connectedDevice.name, data);
                console.log(`String "${data}" inviata con successo`);
                setInputText('');
            } catch (error) {
                console.error(`Errore durante l'invio della stringa "${data}":`, error);
            }
        } else {
            console.error('Nessun dispositivo connesso. Impossibile inviare i dati.');
        }
    };

    const handleExtractAndSharePDF = () => {
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
            html: `<html><body><pre>${reportText}</pre></body></html>`,
            fileName: 'report',
            directory: 'Documents',
        };
        RNHTMLtoPDF.convert(options).then(pdf => {
            Share.open({
                url: `file://${pdf.filePath}`,
                title: 'Share PDF',
            }).catch(error => console.error('Error sharing PDF:', error));
        }).catch(error => console.error('Error converting HTML to PDF:', error));
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
                    <Button key={number} title={`${number}`} onPress={() => handleSendData(number.toString())} />
                ))}
                <Button title="Clear Log" onPress={handleClearLog} />
            </View>
            <ScrollView ref={scrollViewRef} style={{ flex: 1, padding: 10 }}>
                <Text>{logText}</Text>
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 10 }}>
                <TextInput
                    style={{ flex: 1, height: 40, borderColor: 'gray', borderWidth: 1, marginRight: 10 }}
                    onChangeText={setInputText}
                    value={inputText}
                    placeholder="Input Text"
                />
                <Button title="Send" onPress={handleSendData} />
            </View>
            <Button title="Extract and Share PDF" onPress={handleExtractAndSharePDF} />
        </View>
    );
};

export default App;
