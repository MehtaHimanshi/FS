package com.fs.ques4.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fs.ques4.models.employee;
public interface employeerepository extends JpaRepository<employee, Long> {
    // We can add custom queries here if needed
}
