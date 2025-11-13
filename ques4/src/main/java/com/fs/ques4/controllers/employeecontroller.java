package com.fs.ques4.controllers;
import com.fs.ques4.models.employee;
import com.fs.ques4.service.employeeservice;
import org.springframework.web.bind.annotation.*;
        import java.util.List;
@RestController
@RequestMapping("/employees")
public class EmployeeController {

    private final employeeservice employeeService;

    // constructor injection
    public EmployeeController(employeeservice employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @PostMapping
    public Employee addEmployee(@RequestBody Employee employee) {
        return employeeService.saveEmployee(employee);
    }

    @DeleteMapping("/{id}")
    public String deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return "Employee deleted successfully!";
    }
}

