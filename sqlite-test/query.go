package main
import ("database/sql"; "fmt"; _ "github.com/mattn/go-sqlite3")
func main() { db, _ := sql.Open("sqlite3", "../backend/pb_data/auxiliary.db"); rows, _ := db.Query("SELECT error FROM _requests WHERE error != '' ORDER BY created DESC LIMIT 5"); for rows.Next() { var err string; rows.Scan(&err); fmt.Println(err); } }
