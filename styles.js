// styles.js
import { StyleSheet } from 'react-native';

const baseButtonStyle = {
  backgroundColor: '#176dcf', 
  padding: 12, 
  borderRadius: 5, 
  margin: 3,
  alignItems: 'center', 
  justifyContent: 'center'
};

const baseTextButtonStyle = {
  color: 'white', // Colore del testo del pulsante
  fontSize: 16, // Dimensione del carattere del testo del pulsante
  fontWeight: 'bold', // Grassetto per il testo del pulsante
 
};


export const styles = StyleSheet.create({
  button:
  {
    ...baseButtonStyle,
  },
  textbutton:
  {
    ...baseTextButtonStyle,
  },
  container: {
    flex: 1,
    padding: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    height:'20%',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    marginRight: 10,
    borderRadius: 5,
    margin:5
  },
  shareButtonRowContainer: {
    
  },
  shareButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  shareButton: {
    ...baseButtonStyle,
    flex: 1,
    margin: 5
  },
  clearButtonRow: {
    flexDirection: 'column',
    alignItems: 'center',
},
clearButton: {
  ...baseButtonStyle,
  flex: 1, 
  flexDirection: 'column',
},
SerialButton: {
  ...baseButtonStyle,
  flex: 1, 
},
buttonRow: {
  flexDirection: 'column',
  justifyContent: 'space-around',
  flex: 1,
  color: 'white'
},
});
