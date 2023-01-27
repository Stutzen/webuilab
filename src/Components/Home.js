import axios from "axios";
import React, { useState, useEffect } from "react";
import { API_URL, API_URL_ADD } from '../Admin/api';
import { Table, Button, Form, Checkbox } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
function Home() {
    const [firstName , setFirstName] = useState('')
    const [lastName , setLastName] = useState('')
    const [emailAddr , setEmailAddress] = useState('');
    const [contNo , setContNo] = useState('');
    const [checked , setChecked] = useState(false);
    const navigate = useNavigate();
    
    const [apiData, setAPIData] = useState([]);
    const callGetAPI = async () => {
        const resp = await axios.get(API_URL)
        setAPIData(resp.data);
    }
    const sendData = async () => {
        await axios.post(API_URL_ADD,{
            firstName,
            lastName,
            emailAddr,
            contNo,
            checked
        })
    }
    useEffect(() => {
        callGetAPI()
    }, [])
    return (
        <section>
            <Table singleLine className="productList">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Image</Table.HeaderCell>
                        <Table.HeaderCell>Product Name</Table.HeaderCell>
                        <Table.HeaderCell>Price</Table.HeaderCell>
                        <Table.HeaderCell>Qty</Table.HeaderCell>
                        <Table.HeaderCell>Sub Total</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        apiData.map(data => (
                            <Table.Row key={data.id}>
                                <Table.Cell><img src={data.image} alt="product"></img></Table.Cell>
                                <Table.Cell>{data.productName}</Table.Cell>
                                <Table.Cell>{data.price}</Table.Cell>
                                <Table.Cell><Button>-</Button><input type="text"></input><Button>+</Button></Table.Cell>
                                <Table.Cell><input type="text" /></Table.Cell>
                            </Table.Row>
                        ))
                    }
                </Table.Body>
            </Table>
            <Form className="contactForm">
                <Form.Field>
                    <label>Name <span>*</span></label>
                    <input  value={firstName} 
                            placeholder="Enter First Name"
                            onChange={event => setFirstName(event.target.value)}    
                            />
                </Form.Field><br/>
                <Form.Field>
                    <label>Initial</label>
                    <input  value={lastName} 
                            placeholder="Enter Last Name"
                            onChange={event => setLastName(event.target.value)}
                            />
                </Form.Field><br/>
                <Form.Field>
                    <label>Email Address <span>*</span></label>
                    <input  value={emailAddr} 
                            placeholder="Enter Email Address"
                            onChange={event => setEmailAddress(event.target.value)}
                            />
                </Form.Field><br/>
                <Form.Field>
                    <label>Contact Number <span>*</span></label>
                    <input  value={contNo} 
                            placeholder="Enter Contact No."
                            onChange={event => setContNo(event.target.value)}
                            />
                </Form.Field><br/>
                <Form.Field>
                    <Checkbox   checked={checked} 
                                label="I have read and agree to the terms and conditions"
                                onChange={() => setChecked(!checked)}
                                />
                </Form.Field><br/>
                <Form.Field>
                    <p>By checking the above box, you agree to all the terms and conditions mentioned under the Goodwill fireworks. To receive an active response to your B2B inquiries we suggest you place an order of minimum 1 lakh because the order value less than might get a very delayed or no response at all. In terms of our shipping policy, we have delivery offices placed at every location and you can collect your products there. The delivery policy also includes you to pay completely for the products to be shipped to your location. By checking the box you are acknowledged to all the policies mentioned under the T&C, Privacy Policies of the Goodwill fireworks and to the above-mentioned ones.</p>
                </Form.Field>
                <Form.Field>
                    <Button onClick={sendData}>Submit</Button>
                </Form.Field>
            </Form>
        </section>
    )
}
export default Home