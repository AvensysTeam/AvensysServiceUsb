import React, { useEffect, useState, useRef } from 'react';
import { DeviceEventEmitter, ScrollView, Text, View, TextInput } from 'react-native';
import { RNSerialport, definitions, actions } from 'react-native-usb-serialport';
import { extractAndShareReportPDF, extractAndShareFullPDF } from './PDF';
import CustomButton from './CustomButton'; 
import { styles } from './styles';
const App = () => {
    const [logText, setLogText] = useState('');
    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef();
    const [connectedDevice, setConnectedDevice] = useState(null);
    const isTimestampEnabledRef = useRef(false);
   
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
                const timestamp = isTimestampEnabledRef.current ? new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(2, 19) : '';
                const logEntry = isTimestampEnabledRef.current ? `${timestamp}: ${tempLog}` : `${tempLog}`;
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

    const toggleTimestamp = () => {
        isTimestampEnabledRef.current = !isTimestampEnabledRef.current;
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
            console.error(`Nessun dispositivo connesso. Impossibile inviare il dato "${data}".`);
        }
    };

    const handleExtractAndShareReportPDF = async () => {
        await extractAndShareReportPDF(logText);
    };

    const handleExtractAndShareFullPDF = async () => {
        await extractAndShareFullPDF(logText);
    };

    const buttonText = isTimestampEnabledRef.current ? "Disattiva Timestamp" : "Attiva Timestamp";

    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
                    {[1, 4,7].map(number => (
                        <CustomButton key={number} title={`${number}`} onPress={() => handleSendData(number.toString())} style={styles.SerialButton}/>
                    ))}
                </View>
                <View style={styles.buttonRow}>
                    {[2, 5, 8].map(number => (
                        <CustomButton key={number} title={`${number}`} onPress={() => handleSendData(number.toString())} style={styles.SerialButton}/>
                    ))}
                </View>
                <View style={styles.buttonRow}>
                    {[3, 6, 9].map(number => (
                        <CustomButton key={number} title={`${number}`} onPress={() => handleSendData(number.toString())} style={styles.SerialButton} />
                    ))}
                </View>
                <View style={styles.clearButtonRow}>
                    <CustomButton title="Clear Log" onPress={handleClearLog} style={styles.clearButton} />
                </View>
            </View>
            <ScrollView ref={scrollViewRef} style={styles.scrollView}>
                <Text>{logText}</Text>
            </ScrollView>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    onChangeText={text => setInputText(text)} 
                    value={inputText}
                    placeholder="Input Text"
                />
                <CustomButton title="Send" onPress={() => handleSendData(inputText)} />
            </View>
            <View style={styles.shareButtonRowContainer}>
                <View style={styles.shareButtonRow}>
                    <CustomButton title="Extract and Share Report PDF" onPress={handleExtractAndShareReportPDF} style={styles.shareButton} />
                </View>
                <View style={styles.shareButtonRow}>
                    <CustomButton title="Extract and Share Full PDF" onPress={handleExtractAndShareFullPDF} style={styles.shareButton} />
                </View>
                <View style={styles.shareButtonRow}>
                <CustomButton title={buttonText} onPress={toggleTimestamp} style={styles.shareButton} />
            </View>
            </View>
        </View>
    );
};

export default App;
