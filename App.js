// Importações necessárias do React e React Native
import { useState, useEffect } from 'react'
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { Button, Toast, Input, Block, Text } from 'galio-framework'

// Importação do módulo Constants do Expo
import Constants from 'expo-constants'

// Importação do módulo SQLite do Expo
import * as SQLite from 'expo-sqlite'

// Função para abrir o banco de dados SQLite
function openDatabase() {
  if (Platform.OS === 'web') {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        }
      },
    }
  }

  // Abertura do banco de dados "db.db"
  const db = SQLite.openDatabase('db.db')
  return db
}

// Abertura do banco de dados
const db = openDatabase()

// Componente de itens
function Items({ done: doneHeading, onPressItem }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    db.transaction((tx) => {
      // Execução da query SQL para selecionar itens baseado no estado (concluído ou não)
      tx.executeSql(
        'select * from items where done = ?;',
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      )
    })
  }, [])

  // Cria categoria das tarefas
  // V1

  const heading = doneHeading ? 'completa' : 'incompleta'

  if (items === null || items.length === 0) {
    return null
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value }) => (
        <TouchableOpacity
          key={id}
          onPress={() => onPressItem && onPressItem(id)}
          style={{
            backgroundColor: done ? '#1c9963' : '#fff',
            borderColor: '#000',
            borderWidth: 1,
            padding: 8,
            marginBottom: 6,
            borderRadius: 40,
          }}
        >
          <Text style={{ color: done ? '#fff' : '#000' }}>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// Componente principal
export default function App() {
  const [text, setText] = useState(null)
  const [isShow, setShow] = useState(false)
  const [forceUpdate, forceUpdateId] = useForceUpdate()

  // Criar a tabela "items" no banco de dados
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        //V1
        `CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, done INT, value TEXT);`
      )
    })
  }, [])

  // Função para adicionar um novo item à lista
  const add = (text) => {
    // Verifica se o texto está vazio
    if (text === null || text === '') {
      return false
    }

    // Executa a transação SQL para inserir um novo item
    db.transaction(
      (tx) => {
        //V1
        tx.executeSql('insert into items (done, value) values (0, ?)', [text])
        tx.executeSql('select * from items', [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        )
      },
      null,
      forceUpdate
    )
    setShow(!isShow)
    const time = setTimeout(() => {
      setShow(false)
    }, 2000)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Armazenamento Interno - SQLite</Text>

      {/* Verifica a plataforma e exibe uma mensagem para web */}
      {Platform.OS === 'web' ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.flexRow}>
            <TextInput
              onChangeText={(text) => setText(text)}
              onSubmitEditing={() => {
                add(text)
                setText(null)
              }}
              placeholder="O que você precisa fazer?"
              style={styles.input}
              value={text}
            />
          </View>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              add(text)
              setText(null)
            }}
          >
            <Text style={styles.textoBotao}>Gravar</Text>
          </TouchableOpacity>

          <Toast
            style={styles.toast}
            isShow={isShow}
            color="success"
            positionIndicator="top"
          >
            Tarefa Cadastrada
          </Toast>

          {/* Espaçamento vertical */}
          <View style={styles.espaco}></View>

          <ScrollView style={styles.listArea}>
            <Items
              style={styles.selectCard}
              key={`forceupdate-todo-${forceUpdateId}`}
              done={false}
              onPressItem={(id) =>
                db.transaction(
                  (tx) => {
                    tx.executeSql(`update items set done = 1 where id = ?;`, [
                      id,
                    ])
                  },
                  null,
                  forceUpdate
                )
              }
            />
            <Items
              done
              key={`forceupdate-done-${forceUpdateId}`}
              onPressItem={(id) =>
                db.transaction(
                  (tx) => {
                    tx.executeSql(`delete from items where id = ?;`, [id])
                  },
                  null,
                  forceUpdate
                )
              }
            />
          </ScrollView>
        </>
      )}
    </View>
  )
}

// Hook para forçar a atualização do componente
function useForceUpdate() {
  const [value, setValue] = useState(0)
  return [() => setValue(value + 1), value]
}

// Estilos do componente
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flexRow: {
    flexDirection: 'row',
  },
  input: {
    borderColor: '#4630eb',
    borderRadius: 410,
    borderWidth: 1,
    flex: 1,
    height: 58,
    margin: 16,
    padding: 20,
  },
  listArea: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: 'red',
    height: 60,
    width: 120,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  textoBotao: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 30,
  },
  espaco: {
    height: 20,
  },
  toast: {
    margin: 40,
    borderRadius: 40,
    top: -3,
    display: 'flex',
    alignItems: 'center',
  },
})
