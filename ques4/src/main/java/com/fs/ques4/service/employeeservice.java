package com.fs.ques4.service;
import com.fs.ques4.models.employee;
import com.fs.ques4.repository.employeerepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class employeeservice {

    private final employeerepository employeerepository;

    // constructor-based dependency injection
    public employeeservice(employeerepository employeerepository) {
        this.employeerepository = employeerepository;
    }

    public List<employee> getAllEmployees() {
        return employeerepository.findAll();
    }

    public employee saveEmployee(employee employee) {
        return employeerepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        employeerepository.deleteById(id);
    }
}

