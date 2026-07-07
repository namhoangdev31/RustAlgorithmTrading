variable "db_url" {
  type    = string
  default = "postgres://postgres:postgres@localhost:5432/trading_db?sslmode=disable"
}

env "local" {
  src = "file://migrations"
  dev = "docker://postgres/17/dev"
  migration {
    dir = "file://migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
