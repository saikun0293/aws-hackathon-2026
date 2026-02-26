import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from "react-native"

import { useAuthenticator } from "@aws-amplify/ui-react-native"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "../../amplify/data/resource"

const client = generateClient<Schema>()

type Todo = Schema["Todo"]["type"]

export function HomeScreen() {
  const { user, signOut } = useAuthenticator()
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)

  // Real-time subscription — updates arrive automatically
  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => {
        setTodos([...items])
        setLoading(false)
      }
    })
    return () => sub.unsubscribe()
  }, [])

  const createTodo = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    await client.models.Todo.create({ content: trimmed, isDone: false })
    setInput("")
  }

  const toggleDone = (todo: Todo) => {
    client.models.Todo.update({ id: todo.id, isDone: !todo.isDone })
  }

  const deleteTodo = (todo: Todo) => {
    client.models.Todo.delete({ id: todo.id })
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>
          Hello, {user?.signInDetails?.loginId ?? "there"}!
        </Text>
        <Button title="Sign Out" onPress={signOut} color="#e74c3c" />
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="New todo..."
          onSubmitEditing={createTodo}
          returnKeyType="done"
        />
        <Button title="Add" onPress={createTodo} />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>No todos yet. Add one above!</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.todoRow}>
              <TouchableOpacity
                style={styles.todoText}
                onPress={() => toggleDone(item)}
              >
                <Text style={[styles.todoContent, item.isDone && styles.done]}>
                  {item.isDone ? "✓ " : "○ "}
                  {item.content}
                </Text>
              </TouchableOpacity>
              <Button
                title="Delete"
                onPress={() => deleteTodo(item)}
                color="#999"
              />
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  welcome: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff"
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12
  },
  todoText: { flex: 1 },
  todoContent: { fontSize: 15 },
  done: { textDecorationLine: "line-through", color: "#999" },
  separator: { height: 8 },
  empty: { textAlign: "center", color: "#aaa", marginTop: 48, fontSize: 15 }
})
