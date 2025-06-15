import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../services/api/api";

const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required").label("Name"),
    email: Yup.string().email("Invalid email").required("Email is required").label("Email"),
    password: Yup.string().required("Password is required").min(6, "Password must be at least 6 characters").label("Password"),
});

const Register = () => {
    const mutation = useMutation({
        mutationFn: registerUser,
        mutationKey: ["register"],
    });
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            {/* Display message */}
            {mutation.isError && <Text style={styles.error}>{mutation.error?.response?.data?.message || "Register failed"}</Text>}
            {mutation.isSuccess && <Text style={styles.success}>{mutation.data?.message || "Register successful"}</Text>}
            <Formik
                initialValues={{ name: "", email: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                    mutation.mutate(values);
                }}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            onChangeText={handleChange("name")}
                            onBlur={handleBlur("name")}
                            value={values.name}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            onChangeText={handleChange("email")}
                            onBlur={handleBlur("email")}
                            value={values.email}
                            keyboardType="email-address"
                        />
                        {errors.email && touched.email && <Text style={styles.error}>{errors.email}</Text>}
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            onChangeText={handleChange("password")}
                            onBlur={handleBlur("password")}
                            value={values.password}
                            secureTextEntry
                        />
                        {errors.password && touched.password && <Text style={styles.error}>{errors.password}</Text>}
                        {/* Register Button */}
                        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={mutation.isPending}>
                            {mutation.isPending ?
                                (<ActivityIndicator size="small" color="white" />) : (<Text style={styles.buttonText}>Register</Text>)}
                        </TouchableOpacity>
                    </View>
                )}
            </Formik>
        </View>
    );
};

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    input: {
        width: "100%",
        height: 40,
        borderWidth: 1,
        borderColor: "gray",
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    form: {
        width: "80%",
    },
    error: {
        color: "red",
        marginBottom: 10,
    },
    button: {
        backgroundColor: "blue",
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    success: {
        color: "green",
        marginBottom: 10,
    },
});
