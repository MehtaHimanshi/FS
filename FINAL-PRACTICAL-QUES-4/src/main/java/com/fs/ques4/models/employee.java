package com.fs.ques4.models;

import jakarta.persistence.*;
@Entity
@Table(name = "employees")  // optional - defines table name
public class employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(unique = true)
    private String email;
    private Double salary;
    public employee() {}
    public employee(String name, String email, Double salary) {
        this.name = name;
        this.email = email;
        this.salary = salary;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }
}



